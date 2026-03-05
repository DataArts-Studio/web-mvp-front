'use server';

import * as Sentry from '@sentry/nextjs';
import { CreateTestCase, TestCase, TestCaseDTO, toCreateTestCaseDTO, toTestCase } from '@/entities';
import type { TestCaseListItem } from '@/entities/test-case/model/types';
import { getDatabase, testCases, testRunSuites, testCaseRuns, testRuns, milestoneTestSuites } from '@/shared/lib/db';
import type { ActionResult } from '@/shared/types';
import { and, eq, sql, inArray, ilike, or, desc, asc } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import { requireProjectAccess } from '@/access/lib/require-access';
import { checkStorageLimit } from '@/shared/lib/db';
import { createVersionSnapshot } from '@/entities/test-case-version/api/actions';
import { detectChangedFields, generateChangeSummary } from '@/entities/test-case-version/model/diff-utils';











type getTestCasesParams = {
  project_id: string;
  limits?: { offset: number; limit: number };
};

export const getTestCases = async ({
  project_id,
  limits = { offset: 0, limit: 10 },
}: getTestCasesParams): Promise<ActionResult<TestCase[]>> => {
  try {
    const db = getDatabase();
    const rows = await db
      .select()
      .from(testCases)
      .where(
        and(
          eq(testCases.project_id, project_id),
          eq(testCases.lifecycle_status, 'ACTIVE')
        )
      );
    if (!rows)
      return { success: false, errors: { _testCase: ['테스트 케이스가 존재하지 않습니다.'] } };

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
      resultStatus: row.result_status,
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
      errors: { _testCase: ['테스트케이스를 불러오는 도중 오류가 발생했습니다.'] },
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
    const db = getDatabase();

    // WHERE 조건 구성
    const conditions = [
      eq(testCases.project_id, project_id),
      eq(testCases.lifecycle_status, 'ACTIVE'),
    ];

    if (suiteId === '__uncategorized__') {
      conditions.push(sql`${testCases.test_suite_id} IS NULL`);
    } else if (suiteId && suiteId !== 'all') {
      conditions.push(eq(testCases.test_suite_id, suiteId));
    }

    if (search?.trim()) {
      const keyword = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(testCases.name, keyword),
          ilike(testCases.case_key, keyword),
        )!
      );
    }

    const whereClause = and(...conditions);

    // COUNT 쿼리
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(testCases)
      .where(whereClause);

    const totalItems = countResult?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalItems / size));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const offset = (safePage - 1) * size;

    // ORDER BY 구성
    const [sortField, sortOrder] = sort.split('-') as [string, 'asc' | 'desc'];
    const sortColumn =
      sortField === 'title' ? testCases.name :
      sortField === 'createdAt' ? testCases.created_at :
      testCases.updated_at;
    const orderFn = sortOrder === 'asc' ? asc : desc;

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
        result_status: testCases.result_status,
        created_at: testCases.created_at,
        updated_at: testCases.updated_at,
        archived_at: testCases.archived_at,
        lifecycle_status: testCases.lifecycle_status,
      })
      .from(testCases)
      .where(whereClause)
      .orderBy(orderFn(sortColumn))
      .limit(size)
      .offset(offset);

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
      resultStatus: row.result_status,
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
      errors: { _testCase: ['테스트케이스를 불러오는 도중 오류가 발생했습니다.'] },
    };
  }
};

export const getTestCase = async (id: string): Promise<ActionResult<TestCase>> => {
  try {
    const db = getDatabase();
    const [row] = await db
      .select()
      .from(testCases)
      .where(
        and(
          eq(testCases.id, id),
          eq(testCases.lifecycle_status, 'ACTIVE')
        )
      );

    if (!row) {
      return {
        success: false,
        errors: { _testCase: ['테스트 케이스를 찾을 수 없습니다.'] },
      };
    }

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
      resultStatus: row.result_status,
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
      errors: { _testCase: ['테스트케이스를 불러오는 도중 오류가 발생했습니다.'] },
    };
  }
};

export const createTestCase = async (input: CreateTestCase): Promise<ActionResult<TestCase>> => {
  try {
    const [hasAccess, storageError] = await Promise.all([
      requireProjectAccess(input.projectId),
      checkStorageLimit(input.projectId),
    ]);
    if (!hasAccess) {
      return { success: false, errors: { _testCase: ['접근 권한이 없습니다.'] } };
    }
    if (storageError) return storageError;

    const db = getDatabase();
    const dto = toCreateTestCaseDTO(input);
    const id = uuidv7();
    const now = new Date();

    const [maxResult] = await db
      .select({ max: sql<number>`COALESCE(MAX(${testCases.display_id}), 0)` })
      .from(testCases)
      .where(eq(testCases.project_id, input.projectId));
    const nextDisplayId = (maxResult?.max ?? 0) + 1;

    const [inserted] = await db
      .insert(testCases)
      .values({
        id,
        ...dto,
        display_id: nextDisplayId,
        case_key: `TC-${String(nextDisplayId).padStart(3, '0')}`,
        result_status: 'untested',
        created_at: now,
        updated_at: now,
        archived_at: null,
        lifecycle_status: 'ACTIVE',
      })
      .returning();

    if (!inserted) {
      return {
        success: false,
        errors: { _testCase: ['테스트케이스를 생성하는 도중 오류가 발생했습니다.'] },
      };
    }

    // 버전 v1 스냅샷 자동 생성
    try {
      await createVersionSnapshot(
        id,
        {
          name: inserted.name,
          test_type: inserted.test_type,
          tags: inserted.tags,
          pre_condition: inserted.pre_condition,
          steps: inserted.steps,
          expected_result: inserted.expected_result,
        },
        'create',
        [],
        '테스트 케이스 생성'
      );
    } catch (snapshotError) {
      Sentry.captureException(snapshotError, { extra: { action: 'createTestCase:versionSnapshot' } });
    }

    // 스위트에 바로 생성한 경우 연결된 테스트 실행에 동기화
    if (inserted.test_suite_id) {
      try {
        await syncCaseToLinkedRuns(id, inserted.test_suite_id);
      } catch (syncError) {
        Sentry.captureException(syncError, { extra: { action: 'createTestCase:syncToRuns' } });
      }
    }

    const result: TestCase = toTestCase(inserted as TestCaseDTO);

    return {
      success: true,
      data: result,
      message: '테스트 케이스를 생성하였습니다.',
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'createTestCase' } });
    return {
      success: false,
      errors: { _testCase: ['테스트케이스를 생성하는 도중 오류가 발생했습니다.'] },
    };
  }
};

/**
 * 케이스가 스위트에 추가될 때, 해당 스위트가 연결된 테스트 실행들에 케이스를 동기화합니다.
 * 1) test_run_suites 직접 링크
 * 2) 마일스톤 체인: suite → milestone_test_suites → milestone → test_runs
 */
async function syncCaseToLinkedRuns(caseId: string, suiteId: string) {
  const db = getDatabase();

  // 1. test_run_suites 직접 링크로 연결된 런
  const directRuns = await db
    .select({ test_run_id: testRunSuites.test_run_id })
    .from(testRunSuites)
    .where(eq(testRunSuites.test_suite_id, suiteId));

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
  const allRunIds = new Set<string>();
  for (const r of directRuns) {
    if (r.test_run_id) allRunIds.add(r.test_run_id);
  }
  for (const r of milestoneRuns) {
    allRunIds.add(r.id);
  }

  if (allRunIds.size === 0) return;

  const runIds = Array.from(allRunIds);

  // 마일스톤 체인으로 찾은 런에 test_run_suites 엔트리가 없으면 생성
  const existingRunSuites = await db
    .select({ test_run_id: testRunSuites.test_run_id })
    .from(testRunSuites)
    .where(
      and(
        inArray(testRunSuites.test_run_id, runIds),
        eq(testRunSuites.test_suite_id, suiteId)
      )
    );
  const existingRunSuiteIds = new Set(existingRunSuites.map((r) => r.test_run_id));
  const missingRunSuiteIds = runIds.filter((id) => !existingRunSuiteIds.has(id));

  if (missingRunSuiteIds.length > 0) {
    await db.insert(testRunSuites).values(
      missingRunSuiteIds.map((runId) => ({
        test_run_id: runId,
        test_suite_id: suiteId,
      }))
    ).onConflictDoNothing();
  }

  // 이미 등록된 케이스런 확인 (중복 방지)
  const existingRows = await db
    .select({ test_run_id: testCaseRuns.test_run_id })
    .from(testCaseRuns)
    .where(
      and(
        inArray(testCaseRuns.test_run_id, runIds),
        eq(testCaseRuns.test_case_id, caseId)
      )
    );

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
}

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
      return { success: false, errors: { _testCase: ['접근 권한이 없습니다.'] } };
    }

    const storageError = await checkStorageLimit(existing.project_id);
    if (storageError) return storageError;

    const updateData: Record<string, unknown> = {
      updated_at: new Date(),
    };

    if (updateFields.title !== undefined) {
      updateData.name = updateFields.title;
    }
    if (updateFields.testSuiteId !== undefined) {
      updateData.test_suite_id = updateFields.testSuiteId;
    }
    if (updateFields.sectionId !== undefined) {
      updateData.section_id = updateFields.sectionId;
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

    const [updated] = await db
      .update(testCases)
      .set(updateData)
      .where(eq(testCases.id, id))
      .returning();

    if (!updated) {
      return {
        success: false,
        errors: { _testCase: ['테스트케이스를 찾을 수 없습니다.'] },
      };
    }

    // 버전 스냅샷 자동 생성
    try {
      const oldSnapshot = {
        name: existing.name,
        test_type: existing.test_type,
        tags: existing.tags,
        pre_condition: existing.pre_condition,
        steps: existing.steps,
        expected_result: existing.expected_result,
      };
      const newSnapshot = {
        name: updated.name,
        test_type: updated.test_type,
        tags: updated.tags,
        pre_condition: updated.pre_condition,
        steps: updated.steps,
        expected_result: updated.expected_result,
      };
      const changedFields = detectChangedFields(oldSnapshot, newSnapshot);
      if (changedFields.length > 0) {
        const changeSummary = generateChangeSummary(changedFields, 'edit');
        await createVersionSnapshot(id, newSnapshot, 'edit', changedFields, changeSummary);
      }
    } catch (snapshotError) {
      Sentry.captureException(snapshotError, { extra: { action: 'updateTestCase:versionSnapshot' } });
    }

    // 스위트 변경 시 연결된 테스트 실행에 케이스 동기화
    if (updateFields.testSuiteId) {
      try {
        await syncCaseToLinkedRuns(id, updateFields.testSuiteId);
      } catch (syncError) {
        Sentry.captureException(syncError, { extra: { action: 'updateTestCase:syncToRuns' } });
      }
    }

    const result: TestCase = toTestCase(updated as TestCaseDTO);

    return {
      success: true,
      data: result,
      message: '테스트케이스를 수정하였습니다.',
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'updateTestCase' } });
    return {
      success: false,
      errors: { _testCase: ['테스트케이스를 수정하는 도중 오류가 발생했습니다.'] },
    };
  }
};

export const archiveTestCase = async (id: string): Promise<ActionResult<{ id: string }>> => {
  try {
    const db = getDatabase();

    // 접근 권한 확인
    const [existing] = await db.select({ projectId: testCases.project_id }).from(testCases).where(eq(testCases.id, id)).limit(1);
    if (!existing?.projectId || !(await requireProjectAccess(existing.projectId))) {
      return { success: false, errors: { _testCase: ['접근 권한이 없습니다.'] } };
    }

    const [archived] = await db
      .update(testCases)
      .set({
        archived_at: new Date(),
        lifecycle_status: 'DELETED',
        updated_at: new Date(),
      })
      .where(eq(testCases.id, id))
      .returning();

    if (!archived) {
      return {
        success: false,
        errors: { _testCase: ['테스트케이스를 찾을 수 없습니다.'] },
      }
    }

    return {
      success: true,
      data: { id: archived.id },
      message: '테스트케이스가 휴지통으로 이동되었습니다.',
    }
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'archiveTestCase' } });
    return {
      success: false,
      errors: { _testCase: ['테스트 케이스를 삭제하는 도중 오류가 발생했습니다.'] },
    };
  }
};