'use server';

import { ACCESS_DENIED, belongsToProject, canAccess } from '@/access/lib/project-scope';
import { requireProjectAccess } from '@/access/lib/require-access';
import { CreateTestCase, TestCase, TestCaseDTO, toCreateTestCaseDTO, toTestCase } from '@/entities';
import {
  type SnapshotData,
  createVersionSnapshot,
} from '@/entities/test-case-version/api/create-version-snapshot';
import {
  detectChangedFields,
  generateChangeSummary,
} from '@/entities/test-case-version/model/diff-utils';
import { lockCaseNumbers, toCaseKey } from '@/entities/test-case/api/case-number-lock';
import { getLatestResultStatuses } from '@/entities/test-case/api/latest-result';
import { CASE_MESSAGE_CODES } from '@/entities/test-case/model/message-codes';
import type { TestCaseListItem } from '@/entities/test-case/model/types';
import {
  excludeArchivedCasesFromRuns,
  recomputeTestRunStatus,
} from '@/entities/test-run/api/run-scope';
import { INVALIDATE, invalidateCache } from '@/shared/lib/cache/tags';
import { toContainsPattern } from '@/shared/lib/like-pattern';
import { validateName, withSuffix } from '@/shared/lib/normalize-name';
import { checkStorageLimit } from '@/shared/lib/storage/check-storage-limit';
import type { ActionResult } from '@/shared/types';
import * as Sentry from '@sentry/nextjs';
import {
  getDatabase,
  milestoneTestSuites,
  testCaseRuns,
  testCases,
  testRunSuites,
  testRuns,
  testSuiteSections,
} from '@testea/db';
import { and, asc, desc, eq, ilike, inArray, ne, or, sql } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';

/**
 * 케이스에 붙일 스위트·섹션이 케이스 프로젝트 소속인지 확인한다.
 * 스위트에 연결된 실행으로 케이스가 곧바로 동기화되므로, 다른 프로젝트 ID 는 쓰기 전에 거부한다.
 */
async function caseLinksBelongTo(
  projectId: string,
  suiteId: string | null | undefined,
  sectionId: string | null | undefined
): Promise<boolean> {
  if (suiteId && !(await belongsToProject('testSuite', suiteId, projectId))) return false;
  if (sectionId && !(await belongsToProject('section', sectionId, projectId))) return false;
  return true;
}

/**
 * 섹션은 케이스가 속한 스위트의 것이어야 한다. 스위트 상세는 그 스위트의 섹션과 미분류만 그리므로,
 * 다른 스위트의 섹션이 남으면 케이스가 개수에만 잡히고 화면 어디에도 보이지 않는다 (#383).
 * 최종 스위트에 없는 섹션이면 미분류(null)로 돌린다.
 */
async function sectionForSuite(
  suiteId: string | null | undefined,
  sectionId: string | null | undefined
): Promise<string | null> {
  if (!sectionId || !suiteId) return null;
  const [section] = await getDatabase()
    .select({ id: testSuiteSections.id })
    .from(testSuiteSections)
    .where(and(eq(testSuiteSections.id, sectionId), eq(testSuiteSections.suite_id, suiteId)))
    .limit(1);
  return section ? sectionId : null;
}

const CASE_NAME_MAX_LENGTH = 200;

/** 이름 검증 실패 이유를 사용자에게 보여 줄 메시지 코드로 바꾼다. 길이 초과는 길이 안내로 보인다 (#412). */
const nameErrorCode = (reason: 'empty' | 'too_long') =>
  reason === 'too_long' ? CASE_MESSAGE_CODES.NAME_TOO_LONG : CASE_MESSAGE_CODES.NAME_REQUIRED;
/** 케이스 커스텀 순서 간격. features/reorder 의 SORT_ORDER_GAP 과 같은 값이다. */
const CASE_SORT_ORDER_GAP = 1000;

type getTestCasesParams = {
  project_id: string;
  limits?: { offset: number; limit: number };
};

export const getTestCases = async ({
  project_id,
}: getTestCasesParams): Promise<ActionResult<TestCase[]>> => {
  try {
    if (!(await canAccess('project', project_id))) return ACCESS_DENIED;

    const db = getDatabase();
    const rows = await db
      .select()
      .from(testCases)
      .where(and(eq(testCases.project_id, project_id), eq(testCases.lifecycle_status, 'ACTIVE')));
    if (!rows) return { success: false, errors: { _testCase: [CASE_MESSAGE_CODES.NOT_FOUND] } };
    const latestStatuses = await getLatestResultStatuses(
      db,
      rows.map((row) => row.id)
    );

    const result: TestCase[] = rows.map((row) => ({
      id: row.id,
      projectId: row.project_id ?? '',
      testSuiteId: row.test_suite_id ?? undefined,
      sectionId: row.section_id ?? null,
      displayId: row.display_id ?? 0,
      caseKey: `TC-${String(row.display_id ?? 0).padStart(3, '0')}`,
      title: row.name,
      testType: row.test_type ?? '',
      tags: row.tags ?? [],
      preCondition: row.pre_condition ?? '',
      testSteps: row.steps ?? '',
      expectedResult: row.expected_result ?? '',
      sortOrder: row.sort_order ?? 0,
      resultStatus: latestStatuses.get(row.id) ?? 'untested',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      archivedAt: row.archived_at ?? null,
      lifecycleStatus: row.lifecycle_status,
    }));

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'getTestCases' } });
    return {
      success: false,
      errors: { _testCase: [CASE_MESSAGE_CODES.LOAD_FAILED] },
    };
  }
};

/** 케이스 목록·내보내기가 같은 필터를 쓰도록 WHERE 조건을 한곳에서 만든다. */
function buildCaseListWhere(
  projectId: string,
  { search, suiteId }: { search?: string; suiteId?: string }
) {
  const conditions = [
    eq(testCases.project_id, projectId),
    eq(testCases.lifecycle_status, 'ACTIVE'),
  ];

  if (suiteId === '__uncategorized__') {
    conditions.push(sql`${testCases.test_suite_id} IS NULL`);
  } else if (suiteId && suiteId !== 'all') {
    conditions.push(eq(testCases.test_suite_id, suiteId));
  }

  if (search?.trim()) {
    // 검색어의 %·_ 가 와일드카드로 동작하지 않게 이스케이프한다 (#411).
    const keyword = toContainsPattern(search.trim());
    conditions.push(or(ilike(testCases.name, keyword), ilike(testCases.case_key, keyword))!);
  }

  return and(...conditions);
}

/** 목록 화면의 정렬 값을 ORDER BY 로 바꾼다. */
function buildCaseListOrder(sort: string) {
  // 값이 같은 행끼리 순서가 페이지마다 달라지지 않도록 마지막에 id 로 고정한다 (#407).
  if (sort === 'custom')
    return [asc(testCases.sort_order), asc(testCases.created_at), asc(testCases.id)];
  const [sortField, sortOrder] = sort.split('-') as [string, 'asc' | 'desc'];
  const sortColumn =
    sortField === 'title'
      ? testCases.name
      : sortField === 'createdAt'
        ? testCases.created_at
        : testCases.updated_at;
  return [(sortOrder === 'asc' ? asc : desc)(sortColumn), asc(testCases.id)];
}

/** 한 번에 내보낼 수 있는 최대 건수. 가져오기 한도(2,000건)보다 넉넉히 둔다. */
const CASE_EXPORT_LIMIT = 10000;

type GetTestCasesForExportParams = {
  project_id: string;
  sort?: string;
  search?: string;
  suiteId?: string;
};

/**
 * CSV 내보내기용: 현재 필터에 맞는 케이스 전체를 모든 필드와 함께 돌려준다.
 * 목록은 페이지 단위로만 받아 와서, 이전에는 보이는 15건만 내보내졌다 (#382).
 */
export const getTestCasesForExport = async ({
  project_id,
  sort = 'updatedAt-desc',
  search,
  suiteId,
}: GetTestCasesForExportParams): Promise<
  ActionResult<{ items: TestCase[]; truncated: boolean }>
> => {
  try {
    if (!(await canAccess('project', project_id))) return ACCESS_DENIED;

    const db = getDatabase();
    // 한도보다 하나 더 읽어, 잘렸는지 알려 줄 수 있게 한다.
    const fetched = await db
      .select()
      .from(testCases)
      .where(buildCaseListWhere(project_id, { search, suiteId }))
      .orderBy(...buildCaseListOrder(sort))
      .limit(CASE_EXPORT_LIMIT + 1);
    const truncated = fetched.length > CASE_EXPORT_LIMIT;
    const rows = truncated ? fetched.slice(0, CASE_EXPORT_LIMIT) : fetched;
    const latestStatuses = await getLatestResultStatuses(
      db,
      rows.map((row) => row.id)
    );

    return {
      success: true,
      data: {
        truncated,
        items: rows.map((row) => ({
          id: row.id,
          projectId: row.project_id ?? '',
          testSuiteId: row.test_suite_id ?? undefined,
          sectionId: row.section_id ?? null,
          displayId: row.display_id ?? 0,
          caseKey: `TC-${String(row.display_id ?? 0).padStart(3, '0')}`,
          title: row.name,
          testType: row.test_type ?? '',
          tags: row.tags ?? [],
          preCondition: row.pre_condition ?? '',
          testSteps: row.steps ?? '',
          expectedResult: row.expected_result ?? '',
          sortOrder: row.sort_order ?? 0,
          resultStatus: latestStatuses.get(row.id) ?? 'untested',
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          archivedAt: row.archived_at ?? null,
          lifecycleStatus: row.lifecycle_status,
        })),
      },
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'getTestCasesForExport' } });
    return {
      success: false,
      errors: { _testCase: [CASE_MESSAGE_CODES.LOAD_FAILED] },
    };
  }
};

export type PaginationInfo = {
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
};

export type PaginatedTestCases = {
  items: TestCaseListItem[];
  pagination: PaginationInfo;
};

type GetTestCasesListParams = {
  project_id: string;
  page?: number;
  size?: number;
  sort?: string;
  search?: string;
  suiteId?: string;
};

/** 목록 조회용: steps, pre_condition, expected_result 제외하여 페이로드 경량화 */
export const getTestCasesList = async ({
  project_id,
  page = 1,
  size = 15,
  sort = 'updatedAt-desc',
  search,
  suiteId,
}: GetTestCasesListParams): Promise<ActionResult<PaginatedTestCases>> => {
  try {
    if (!(await canAccess('project', project_id))) return ACCESS_DENIED;

    const db = getDatabase();

    const whereClause = buildCaseListWhere(project_id, { search, suiteId });

    // COUNT 쿼리
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(testCases)
      .where(whereClause);

    const totalItems = countResult?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalItems / size));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const offset = (safePage - 1) * size;

    // 데이터 쿼리
    const rows = await db
      .select({
        id: testCases.id,
        project_id: testCases.project_id,
        test_suite_id: testCases.test_suite_id,
        section_id: testCases.section_id,
        display_id: testCases.display_id,
        name: testCases.name,
        test_type: testCases.test_type,
        tags: testCases.tags,
        sort_order: testCases.sort_order,
        created_at: testCases.created_at,
        updated_at: testCases.updated_at,
        archived_at: testCases.archived_at,
        lifecycle_status: testCases.lifecycle_status,
      })
      .from(testCases)
      .where(whereClause)
      .orderBy(...buildCaseListOrder(sort))
      .limit(size)
      .offset(offset);
    const latestStatuses = await getLatestResultStatuses(
      db,
      rows.map((row) => row.id)
    );

    const items: TestCaseListItem[] = rows.map((row) => ({
      id: row.id,
      projectId: row.project_id ?? '',
      testSuiteId: row.test_suite_id ?? undefined,
      sectionId: row.section_id ?? null,
      displayId: row.display_id ?? 0,
      caseKey: `TC-${String(row.display_id ?? 0).padStart(3, '0')}`,
      title: row.name,
      testType: row.test_type ?? '',
      tags: row.tags ?? [],
      sortOrder: row.sort_order ?? 0,
      resultStatus: latestStatuses.get(row.id) ?? 'untested',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      archivedAt: row.archived_at ?? null,
      lifecycleStatus: row.lifecycle_status,
    }));

    return {
      success: true,
      data: {
        items,
        pagination: { page: safePage, size, totalItems, totalPages },
      },
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'getTestCasesList' } });
    return {
      success: false,
      errors: { _testCase: [CASE_MESSAGE_CODES.LOAD_FAILED] },
    };
  }
};

export const getTestCase = async (id: string): Promise<ActionResult<TestCase>> => {
  try {
    if (!(await canAccess('testCase', id))) return ACCESS_DENIED;

    const db = getDatabase();
    const [row] = await db
      .select()
      .from(testCases)
      .where(and(eq(testCases.id, id), eq(testCases.lifecycle_status, 'ACTIVE')));

    if (!row) {
      return {
        success: false,
        errors: { _testCase: [CASE_MESSAGE_CODES.NOT_FOUND] },
      };
    }

    const latestStatuses = await getLatestResultStatuses(db, [row.id]);
    const result: TestCase = {
      id: row.id,
      projectId: row.project_id ?? '',
      testSuiteId: row.test_suite_id ?? undefined,
      sectionId: row.section_id ?? null,
      displayId: row.display_id ?? 0,
      caseKey: `TC-${String(row.display_id ?? 0).padStart(3, '0')}`,
      title: row.name,
      testType: row.test_type ?? '',
      tags: row.tags ?? [],
      preCondition: row.pre_condition ?? '',
      testSteps: row.steps ?? '',
      expectedResult: row.expected_result ?? '',
      sortOrder: row.sort_order ?? 0,
      resultStatus: latestStatuses.get(row.id) ?? 'untested',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      archivedAt: row.archived_at ?? null,
      lifecycleStatus: row.lifecycle_status,
    };

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'getTestCase' } });
    return {
      success: false,
      errors: { _testCase: [CASE_MESSAGE_CODES.LOAD_FAILED] },
    };
  }
};

type Transaction = Parameters<Parameters<ReturnType<typeof getDatabase>['transaction']>[0]>[0];

/** 버전에 남기는 케이스 내용. */
const toSnapshot = (row: typeof testCases.$inferSelect): SnapshotData => ({
  name: row.name,
  test_type: row.test_type,
  tags: row.tags,
  pre_condition: row.pre_condition,
  steps: row.steps,
  expected_result: row.expected_result,
});

export const createTestCase = async (input: CreateTestCase): Promise<ActionResult<TestCase>> => {
  try {
    const [hasAccess, storageError] = await Promise.all([
      requireProjectAccess(input.projectId),
      checkStorageLimit(input.projectId),
    ]);
    if (!hasAccess) {
      return { success: false, errors: { _testCase: [CASE_MESSAGE_CODES.ACCESS_DENIED] } };
    }
    if (!(await caseLinksBelongTo(input.projectId, input.testSuiteId, input.sectionId))) {
      return { success: false, errors: { _testCase: [CASE_MESSAGE_CODES.ACCESS_DENIED] } };
    }
    if (storageError) return storageError;

    const validated = validateName(input.title, CASE_NAME_MAX_LENGTH);
    if (!validated.ok) {
      return { success: false, errors: { _testCase: [nameErrorCode(validated.reason)] } };
    }
    const name = validated.name;

    const db = getDatabase();
    const dto = {
      ...toCreateTestCaseDTO({ ...input, title: name }),
      section_id: await sectionForSuite(input.testSuiteId, input.sectionId),
    };
    const id = uuidv7();
    const now = new Date();

    const inserted = await db.transaction(async (tx) => {
      await lockCaseNumbers(tx, input.projectId);
      const [maxResult] = await tx
        .select({
          max: sql<number>`COALESCE(MAX(${testCases.display_id}), 0)`,
          minSortOrder: sql<number | null>`MIN(${testCases.sort_order})`,
        })
        .from(testCases)
        .where(eq(testCases.project_id, input.projectId));
      const nextDisplayId = (maxResult?.max ?? 0) + 1;
      // 빠른 생성 입력과 낙관적 표시가 목록 맨 위라 새 케이스도 커스텀 순서 맨 위에 둔다 (#380).
      const sortOrder =
        input.sortOrder ?? (maxResult?.minSortOrder ?? CASE_SORT_ORDER_GAP) - CASE_SORT_ORDER_GAP;

      const [row] = await tx
        .insert(testCases)
        .values({
          id,
          ...dto,
          display_id: nextDisplayId,
          case_key: toCaseKey(nextDisplayId),
          sort_order: sortOrder,
          result_status: 'untested',
          created_at: now,
          updated_at: now,
          archived_at: null,
          lifecycle_status: 'ACTIVE',
        })
        .returning();
      if (!row) return row;

      // 버전 v1 과 연결된 실행 동기화까지 함께 반영한다. 하나라도 실패하면 케이스도 만들지 않는다 (#390).
      await createVersionSnapshot(id, toSnapshot(row), 'create', [], '테스트 케이스 생성', tx);
      if (row.test_suite_id) await syncCaseToLinkedRuns(tx, id, row.test_suite_id);

      return row;
    });

    if (!inserted) {
      return {
        success: false,
        errors: { _testCase: [CASE_MESSAGE_CODES.CREATE_FAILED] },
      };
    }

    const result: TestCase = toTestCase(inserted as TestCaseDTO);

    invalidateCache(INVALIDATE.cases);
    return {
      success: true,
      data: result,
      message: CASE_MESSAGE_CODES.CASE_CREATED,
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'createTestCase' } });
    return {
      success: false,
      errors: { _testCase: [CASE_MESSAGE_CODES.CREATE_FAILED] },
    };
  }
};

/**
 * 케이스가 스위트에 추가될 때, 해당 스위트가 연결된 테스트 실행들에 케이스를 동기화합니다.
 * 1) test_run_suites 직접 링크
 * 2) 마일스톤 체인: suite → milestone_test_suites → milestone → test_runs
 */
async function syncCaseToLinkedRuns(db: Transaction, caseId: string, suiteId: string) {
  // 1. test_run_suites 직접 링크로 연결된 런. 실행에서 제거한 스위트는 건너뛴다 (#375).
  const suiteLinks = await db
    .select({ test_run_id: testRunSuites.test_run_id, excluded_at: testRunSuites.excluded_at })
    .from(testRunSuites)
    .where(eq(testRunSuites.test_suite_id, suiteId));
  const excludedRunIds = new Set(
    suiteLinks.filter((link) => link.excluded_at).map((link) => link.test_run_id)
  );

  // 2. 마일스톤 체인으로 연결된 런
  const msRows = await db
    .select({ milestone_id: milestoneTestSuites.milestone_id })
    .from(milestoneTestSuites)
    .where(eq(milestoneTestSuites.test_suite_id, suiteId));

  const milestoneIds = msRows.map((r) => r.milestone_id).filter(Boolean) as string[];

  let milestoneRuns: { id: string }[] = [];
  if (milestoneIds.length > 0) {
    milestoneRuns = await db
      .select({ id: testRuns.id })
      .from(testRuns)
      .where(inArray(testRuns.milestone_id, milestoneIds));
  }

  // 합치고 중복 제거
  const candidateRunIds = new Set<string>();
  for (const r of suiteLinks) {
    if (r.test_run_id && !excludedRunIds.has(r.test_run_id)) candidateRunIds.add(r.test_run_id);
  }
  for (const r of milestoneRuns) {
    if (!excludedRunIds.has(r.id)) candidateRunIds.add(r.id);
  }

  if (candidateRunIds.size === 0) return;

  // 완료되었거나 삭제된 실행은 기록으로 두고 범위를 바꾸지 않는다 (#376).
  const openRuns = await db
    .select({ id: testRuns.id })
    .from(testRuns)
    .where(
      and(
        inArray(testRuns.id, Array.from(candidateRunIds)),
        ne(testRuns.status, 'COMPLETED'),
        eq(testRuns.lifecycle_status, 'ACTIVE')
      )
    );
  const runIds = openRuns.map((r) => r.id);

  if (runIds.length === 0) return;

  // 마일스톤 체인으로 찾은 런에 test_run_suites 엔트리가 없으면 생성
  const existingRunSuiteIds = new Set(suiteLinks.map((r) => r.test_run_id));
  const missingRunSuiteIds = runIds.filter((id) => !existingRunSuiteIds.has(id));

  if (missingRunSuiteIds.length > 0) {
    await db
      .insert(testRunSuites)
      .values(
        missingRunSuiteIds.map((runId) => ({
          test_run_id: runId,
          test_suite_id: suiteId,
        }))
      )
      .onConflictDoNothing();
  }

  // 이미 등록된 케이스런 확인 (중복 방지)
  const existingRows = await db
    .select({ test_run_id: testCaseRuns.test_run_id })
    .from(testCaseRuns)
    .where(and(inArray(testCaseRuns.test_run_id, runIds), eq(testCaseRuns.test_case_id, caseId)));

  const existingRunIds = new Set(existingRows.map((r) => r.test_run_id));
  const newRunIds = runIds.filter((id) => !existingRunIds.has(id));

  if (newRunIds.length === 0) return;

  await db.insert(testCaseRuns).values(
    newRunIds.map((runId) => ({
      id: uuidv7(),
      test_run_id: runId,
      test_case_id: caseId,
      status: 'untested' as const,
      source_type: 'suite' as const,
      source_id: suiteId,
      created_at: new Date(),
      updated_at: new Date(),
    }))
  );

  await recomputeTestRunStatus(db, newRunIds);
}

/**
 * 테스트 케이스를 복사합니다. (제목에 "(복사)" 접미사 추가)
 */
export const duplicateTestCase = async (testCaseId: string): Promise<ActionResult<TestCase>> => {
  try {
    const db = getDatabase();

    // 원본 조회
    const [original] = await db
      .select()
      .from(testCases)
      .where(and(eq(testCases.id, testCaseId), eq(testCases.lifecycle_status, 'ACTIVE')));

    if (!original) {
      return { success: false, errors: { _testCase: [CASE_MESSAGE_CODES.ORIGINAL_NOT_FOUND] } };
    }

    const projectId = original.project_id!;

    const [hasAccess, storageError] = await Promise.all([
      requireProjectAccess(projectId),
      checkStorageLimit(projectId),
    ]);
    if (!hasAccess) {
      return { success: false, errors: { _testCase: [CASE_MESSAGE_CODES.ACCESS_DENIED] } };
    }
    if (storageError) return storageError;

    const id = uuidv7();
    const now = new Date();

    const inserted = await db.transaction(async (tx) => {
      await lockCaseNumbers(tx, projectId);
      const [maxResult] = await tx
        .select({ max: sql<number>`COALESCE(MAX(${testCases.display_id}), 0)` })
        .from(testCases)
        .where(eq(testCases.project_id, projectId));
      const nextDisplayId = (maxResult?.max ?? 0) + 1;

      const [row] = await tx
        .insert(testCases)
        .values({
          id,
          project_id: projectId,
          test_suite_id: original.test_suite_id,
          section_id: original.section_id,
          // 복사본 이름도 이름 제한(200자) 안에 들도록 원래 이름을 자른다 (#412).
          name: withSuffix(original.name, ' (복사)', CASE_NAME_MAX_LENGTH),
          test_type: original.test_type,
          tags: original.tags,
          pre_condition: original.pre_condition,
          steps: original.steps,
          expected_result: original.expected_result,
          sort_order: (original.sort_order ?? 0) + 1,
          display_id: nextDisplayId,
          case_key: toCaseKey(nextDisplayId),
          result_status: 'untested',
          created_at: now,
          updated_at: now,
          archived_at: null,
          lifecycle_status: 'ACTIVE',
        })
        .returning();
      if (!row) return row;

      await createVersionSnapshot(id, toSnapshot(row), 'create', [], '테스트 케이스 복사', tx);
      if (row.test_suite_id) await syncCaseToLinkedRuns(tx, id, row.test_suite_id);

      return row;
    });

    if (!inserted) {
      return {
        success: false,
        errors: { _testCase: [CASE_MESSAGE_CODES.DUPLICATE_FAILED] },
      };
    }

    invalidateCache(INVALIDATE.cases);
    return { success: true, data: toTestCase(inserted as TestCaseDTO) };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'duplicateTestCase', testCaseId } });
    return {
      success: false,
      errors: { _testCase: ['테스트 케이스 복사 중 오류가 발생했습니다.'] },
    };
  }
};

type UpdateTestCaseParams = {
  id: string;
  title?: string;
  testSuiteId?: string | null;
  sectionId?: string | null;
  testType?: string;
  tags?: string[];
  preCondition?: string;
  testSteps?: string;
  expectedResult?: string;
  sortOrder?: number;
};

export const updateTestCase = async (
  params: UpdateTestCaseParams
): Promise<ActionResult<TestCase>> => {
  try {
    const db = getDatabase();
    const { id, ...updateFields } = params;

    // 접근 권한 확인: 전체 row 조회 (버전 스냅샷용)
    const [existing] = await db.select().from(testCases).where(eq(testCases.id, id)).limit(1);
    if (!existing?.project_id || !(await requireProjectAccess(existing.project_id))) {
      return { success: false, errors: { _testCase: [CASE_MESSAGE_CODES.ACCESS_DENIED] } };
    }
    // 다른 탭에서 휴지통으로 보낸 케이스는 수정하지 않는다. 실행 동기화로 되살아나는 것도 막는다 (#408).
    if (existing.lifecycle_status !== 'ACTIVE') {
      return { success: false, errors: { _testCase: [CASE_MESSAGE_CODES.NOT_ACTIVE] } };
    }
    if (
      !(await caseLinksBelongTo(
        existing.project_id,
        updateFields.testSuiteId,
        updateFields.sectionId
      ))
    ) {
      return { success: false, errors: { _testCase: [CASE_MESSAGE_CODES.ACCESS_DENIED] } };
    }

    const storageError = await checkStorageLimit(existing.project_id);
    if (storageError) return storageError;

    const updateData: Record<string, unknown> = {
      updated_at: new Date(),
    };

    if (updateFields.title !== undefined) {
      const validated = validateName(updateFields.title, CASE_NAME_MAX_LENGTH);
      if (!validated.ok) {
        return { success: false, errors: { _testCase: [nameErrorCode(validated.reason)] } };
      }
      updateData.name = validated.name;
    }
    if (updateFields.testSuiteId !== undefined) {
      updateData.test_suite_id = updateFields.testSuiteId;
    }
    if (updateFields.testSuiteId !== undefined || updateFields.sectionId !== undefined) {
      // 스위트만 바꾸면 이전 스위트의 섹션이 남으므로, 바뀐 뒤 스위트 기준으로 섹션을 다시 정한다 (#383).
      updateData.section_id = await sectionForSuite(
        updateFields.testSuiteId !== undefined ? updateFields.testSuiteId : existing.test_suite_id,
        updateFields.sectionId !== undefined ? updateFields.sectionId : existing.section_id
      );
    }
    if (updateFields.testType !== undefined) {
      updateData.test_type = updateFields.testType;
    }
    if (updateFields.tags !== undefined) {
      updateData.tags = updateFields.tags;
    }
    if (updateFields.preCondition !== undefined) {
      updateData.pre_condition = updateFields.preCondition;
    }
    if (updateFields.testSteps !== undefined) {
      updateData.steps = updateFields.testSteps;
    }
    if (updateFields.expectedResult !== undefined) {
      updateData.expected_result = updateFields.expectedResult;
    }
    if (updateFields.sortOrder !== undefined) {
      updateData.sort_order = updateFields.sortOrder;
    }

    // 케이스 저장, 버전 기록, 스위트 변경에 따른 실행 동기화를 함께 반영한다 (#390).
    const updated = await db.transaction(async (tx) => {
      // 확인과 저장 사이에 휴지통으로 가는 경우도 막도록 저장 조건에도 활성 상태를 둔다.
      const [row] = await tx
        .update(testCases)
        .set(updateData)
        .where(and(eq(testCases.id, id), eq(testCases.lifecycle_status, 'ACTIVE')))
        .returning();
      if (!row) return row;

      const newSnapshot = toSnapshot(row);
      const changedFields = detectChangedFields(toSnapshot(existing), newSnapshot);
      if (changedFields.length > 0) {
        const changeSummary = generateChangeSummary(changedFields, 'edit');
        await createVersionSnapshot(id, newSnapshot, 'edit', changedFields, changeSummary, tx);
      }

      if (updateFields.testSuiteId) await syncCaseToLinkedRuns(tx, id, updateFields.testSuiteId);
      return row;
    });

    if (!updated) {
      return {
        success: false,
        errors: { _testCase: [CASE_MESSAGE_CODES.NOT_ACTIVE] },
      };
    }

    const result: TestCase = toTestCase(updated as TestCaseDTO);

    invalidateCache(INVALIDATE.cases);
    return {
      success: true,
      data: result,
      message: CASE_MESSAGE_CODES.CASE_UPDATED,
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'updateTestCase' } });
    return {
      success: false,
      errors: { _testCase: [CASE_MESSAGE_CODES.UPDATE_FAILED] },
    };
  }
};

export const archiveTestCase = async (id: string): Promise<ActionResult<{ id: string }>> => {
  try {
    const db = getDatabase();

    // 접근 권한 확인
    const [existing] = await db
      .select({ projectId: testCases.project_id, lifecycleStatus: testCases.lifecycle_status })
      .from(testCases)
      .where(eq(testCases.id, id))
      .limit(1);
    if (!existing?.projectId || !(await requireProjectAccess(existing.projectId))) {
      return { success: false, errors: { _testCase: [CASE_MESSAGE_CODES.ACCESS_DENIED] } };
    }
    // 이미 휴지통에 있거나 영구 삭제된 케이스를 다시 보관하면 영구 삭제가 휴지통으로 되돌아간다 (#408).
    if (existing.lifecycleStatus !== 'ACTIVE') {
      return { success: false, errors: { _testCase: [CASE_MESSAGE_CODES.NOT_ACTIVE] } };
    }

    const now = new Date();
    const archived = await db.transaction(async (tx) => {
      const [row] = await tx
        .update(testCases)
        .set({
          archived_at: now,
          lifecycle_status: 'DELETED',
          updated_at: now,
        })
        .where(and(eq(testCases.id, id), eq(testCases.lifecycle_status, 'ACTIVE')))
        .returning();
      // 진행 중인 실행의 목록과 진행률에서 뺀다. 복원하면 되돌아온다 (#377).
      if (row) await excludeArchivedCasesFromRuns(tx, [row.id], now);
      return row;
    });

    if (!archived) {
      return {
        success: false,
        errors: { _testCase: [CASE_MESSAGE_CODES.NOT_ACTIVE] },
      };
    }

    invalidateCache(INVALIDATE.cases);
    invalidateCache(INVALIDATE.runs);
    return {
      success: true,
      data: { id: archived.id },
      message: CASE_MESSAGE_CODES.CASE_MOVED_TO_TRASH,
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'archiveTestCase' } });
    return {
      success: false,
      errors: { _testCase: [CASE_MESSAGE_CODES.DELETE_FAILED] },
    };
  }
};
