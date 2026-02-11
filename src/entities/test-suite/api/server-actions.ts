'use server';

import type { CreateTestSuite, TestSuite, TestSuiteCard, RunStatus } from '@/entities/test-suite';
import { toCreateTestSuiteDTO } from '@/entities/test-suite/model/mapper';
import {
  getDatabase,
  testSuites,
  testCases,
  milestoneTestSuites,
  milestones,
  testRunSuites,
  testRuns,
  testCaseRuns,
} from '@/shared/lib/db';
import type { ActionResult } from '@/shared/types';
import { and, eq, count, desc, inArray, isNotNull } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import { requireProjectAccess } from '@/access/lib/require-access';

type GetTestSuitesParams = {
  projectId: string;
  limits?: { offset: number; limit: number };
};

export const createTestSuite = async (input: CreateTestSuite): Promise<ActionResult<TestSuite>> => {
  try {
    const hasAccess = await requireProjectAccess(input.projectId);
    if (!hasAccess) {
      return { success: false, errors: { _testSuite: ['접근 권한이 없습니다.'] } };
    }

    const db = getDatabase();
    const dto = toCreateTestSuiteDTO(input);
    const id = uuidv7();

    const [inserted] = await db
      .insert(testSuites)
      .values({
        id,
        project_id: dto.project_id,
        name: dto.name,
        description: dto.description,
        sort_order: dto.sort_order,
        created_at: new Date(),
        updated_at: new Date(),
        archived_at: null,
        lifecycle_status: 'ACTIVE',
      })
      .returning();

    if (!inserted) {
      return {
        success: false,
        errors: { _testSuite: ['테스트 스위트를 생성하는 도중 오류가 발생했습니다.'] },
      };
    }

    const result: TestSuite = {
      id: inserted.id,
      projectId: inserted.project_id ?? '',
      title: inserted.name,
      description: inserted.description ?? undefined,
      sortOrder: inserted.sort_order ?? 0,
      createdAt: inserted.created_at,
      updatedAt: inserted.updated_at,
      archivedAt: inserted.archived_at ?? null,
      lifecycleStatus: inserted.lifecycle_status,
    };

    return {
      success: true,
      data: result,
      message: '테스트 스위트를 생성하였습니다.',
    };
  } catch (error) {
    console.error('Error creating test suite:', error);
    return {
      success: false,
      errors: { _testSuite: ['테스트 스위트를 생성하는 도중 오류가 발생했습니다.'] },
    };
  }
};

export const getTestSuites = async ({
  projectId,
  limits = { offset: 0, limit: 10 },
}: GetTestSuitesParams): Promise<ActionResult<TestSuite[]>> => {
  try {
    const db = getDatabase();
    const rows = await db
      .select()
      .from(testSuites)
      .where(
        and(
          eq(testSuites.project_id, projectId),
          eq(testSuites.lifecycle_status, 'ACTIVE')
        )
      )
      .limit(limits.limit)
      .offset(limits.offset);

    if (!rows) {
      return {
        success: false,
        errors: { _testSuite: ['테스트 스위트가 존재하지 않습니다.'] },
      };
    }

    const result: TestSuite[] = rows.map((row) => ({
      id: row.id,
      projectId: row.project_id ?? '',
      title: row.name,
      description: row.description ?? undefined,
      sortOrder: row.sort_order ?? 0,
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
    console.error('Error fetching test suites:', error);
    return {
      success: false,
      errors: { _testSuite: ['테스트 스위트를 불러오는 도중 오류가 발생했습니다.'] },
    };
  }
};

export const getTestSuiteById = async (id: string): Promise<ActionResult<TestSuite>> => {
  try {
    const db = getDatabase();
    const [row] = await db.select().from(testSuites).where(eq(testSuites.id, id));

    if (!row) {
      return {
        success: false,
        errors: { _testSuite: ['테스트 스위트를 찾을 수 없습니다.'] },
      };
    }

    const result: TestSuite = {
      id: row.id,
      projectId: row.project_id ?? '',
      title: row.name,
      description: row.description ?? undefined,
      sortOrder: row.sort_order ?? 0,
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
    console.error('Error fetching test suite:', error);
    return {
      success: false,
      errors: { _testSuite: ['테스트 스위트를 불러오는 도중 오류가 발생했습니다.'] },
    };
  }
};

/**
 * 단일 스위트 + 통계 조회 (getTestSuitesWithStats와 동일한 안전한 방식)
 */
export const getTestSuiteByIdWithStats = async (id: string): Promise<ActionResult<TestSuiteCard>> => {
  try {
    const db = getDatabase();

    const [row] = await db.select().from(testSuites).where(eq(testSuites.id, id));
    if (!row) {
      return { success: false, errors: { _testSuite: ['테스트 스위트를 찾을 수 없습니다.'] } };
    }

    const result = await getTestSuitesWithStats({ projectId: row.project_id ?? '', limits: { offset: 0, limit: 999 } });
    const card = result.success ? result.data.find((s) => s.id === id) : undefined;

    if (!card) {
      // fallback: 기본 데이터만 반환
      return {
        success: true,
        data: {
          id: row.id,
          projectId: row.project_id ?? '',
          title: row.name,
          description: row.description ?? undefined,
          sortOrder: row.sort_order ?? 0,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          archivedAt: row.archived_at ?? null,
          lifecycleStatus: row.lifecycle_status,
          tag: { label: '기본', tone: 'neutral' as const },
          includedPaths: [],
          caseCount: 0,
          executionHistoryCount: 0,
          recentRuns: [],
        },
      };
    }

    return { success: true, data: card };
  } catch (error) {
    console.error('Error fetching test suite by id with stats:', error);
    return {
      success: false,
      errors: { _testSuite: ['테스트 스위트를 불러오는 도중 오류가 발생했습니다.'] },
    };
  }
};

type UpdateTestSuiteParams = {
  id: string;
  title?: string;
  description?: string;
  sortOrder?: number;
};

export const updateTestSuite = async (params: UpdateTestSuiteParams): Promise<ActionResult<TestSuite>> => {
  try {
    const db = getDatabase();
    const { id, ...updateFields } = params;

    // 접근 권한 확인
    const [existing] = await db.select({ projectId: testSuites.project_id }).from(testSuites).where(eq(testSuites.id, id)).limit(1);
    if (!existing?.projectId || !(await requireProjectAccess(existing.projectId))) {
      return { success: false, errors: { _testSuite: ['접근 권한이 없습니다.'] } };
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date(),
    };

    if (updateFields.title !== undefined) {
      updateData.name = updateFields.title;
    }
    if (updateFields.description !== undefined) {
      updateData.description = updateFields.description;
    }
    if (updateFields.sortOrder !== undefined) {
      updateData.sort_order = updateFields.sortOrder;
    }

    const [updated] = await db
      .update(testSuites)
      .set(updateData)
      .where(eq(testSuites.id, id))
      .returning();

    if (!updated) {
      return {
        success: false,
        errors: { _testSuite: ['테스트 스위트를 찾을 수 없습니다.'] },
      };
    }

    const result: TestSuite = {
      id: updated.id,
      projectId: updated.project_id ?? '',
      title: updated.name,
      description: updated.description ?? undefined,
      sortOrder: updated.sort_order ?? 0,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
      archivedAt: updated.archived_at ?? null,
      lifecycleStatus: updated.lifecycle_status,
    };

    return {
      success: true,
      data: result,
      message: '테스트 스위트를 수정하였습니다.',
    };
  } catch (error) {
    console.error('Error updating test suite:', error);
    return {
      success: false,
      errors: { _testSuite: ['테스트 스위트를 수정하는 도중 오류가 발생했습니다.'] },
    };
  }
};

/**
 * 스위트 목록 + 통계를 안전하게 조회 (각 관계 데이터를 별도 쿼리로 조회)
 */
export const getTestSuitesWithStats = async ({
  projectId,
  limits = { offset: 0, limit: 50 },
}: GetTestSuitesParams): Promise<ActionResult<TestSuiteCard[]>> => {
  try {
    const db = getDatabase();

    // 1) 기본 스위트 목록
    const suiteRows = await db
      .select()
      .from(testSuites)
      .where(and(eq(testSuites.project_id, projectId), eq(testSuites.lifecycle_status, 'ACTIVE')))
      .limit(limits.limit)
      .offset(limits.offset);

    if (suiteRows.length === 0) {
      return { success: true, data: [] };
    }

    const suiteIds = suiteRows.map((s) => s.id);

    // 2) 케이스 수 집계
    const caseCountRows = await db
      .select({ suiteId: testCases.test_suite_id, cnt: count() })
      .from(testCases)
      .where(and(eq(testCases.lifecycle_status, 'ACTIVE'), inArray(testCases.test_suite_id, suiteIds)))
      .groupBy(testCases.test_suite_id);
    const caseCountMap = new Map(caseCountRows.map((r) => [r.suiteId, Number(r.cnt)]));

    // 3) 케이스 test_type 목록 (포함 경로용)
    const testTypeRows = await db
      .select({ suiteId: testCases.test_suite_id, testType: testCases.test_type })
      .from(testCases)
      .where(
        and(
          eq(testCases.lifecycle_status, 'ACTIVE'),
          inArray(testCases.test_suite_id, suiteIds),
          isNotNull(testCases.test_type),
        )
      );
    const testTypeMap = new Map<string, Set<string>>();
    for (const r of testTypeRows) {
      if (!r.suiteId || !r.testType) continue;
      if (!testTypeMap.has(r.suiteId)) testTypeMap.set(r.suiteId, new Set());
      testTypeMap.get(r.suiteId)!.add(r.testType);
    }

    // 4) 연결된 마일스톤 (첫 번째만)
    let milestoneMap = new Map<string, { id: string; title: string; versionLabel: string }>();
    try {
      const msRows = await db
        .select({
          suiteId: milestoneTestSuites.test_suite_id,
          milestoneId: milestones.id,
          milestoneName: milestones.name,
          progressStatus: milestones.progress_status,
        })
        .from(milestoneTestSuites)
        .innerJoin(milestones, eq(milestoneTestSuites.milestone_id, milestones.id))
        .where(inArray(milestoneTestSuites.test_suite_id, suiteIds));
      for (const r of msRows) {
        if (r.suiteId && !milestoneMap.has(r.suiteId)) {
          milestoneMap.set(r.suiteId, {
            id: r.milestoneId,
            title: r.milestoneName,
            versionLabel: r.progressStatus ?? '',
          });
        }
      }
    } catch (e) {
      console.warn('milestoneTestSuites 조회 실패:', e);
    }

    // 5) 실행 이력 수 집계
    const runCountRows = await db
      .select({ suiteId: testRunSuites.test_suite_id, cnt: count() })
      .from(testRunSuites)
      .where(inArray(testRunSuites.test_suite_id, suiteIds))
      .groupBy(testRunSuites.test_suite_id);
    const runCountMap = new Map(runCountRows.map((r) => [r.suiteId, Number(r.cnt)]));

    // 6) 최근 실행 (스위트별 최신 5개 run)
    const recentRunRows = await db
      .select({
        suiteId: testRunSuites.test_suite_id,
        runId: testRuns.id,
        runStatus: testRuns.status,
        runCreatedAt: testRuns.created_at,
      })
      .from(testRunSuites)
      .innerJoin(testRuns, eq(testRunSuites.test_run_id, testRuns.id))
      .where(inArray(testRunSuites.test_suite_id, suiteIds))
      .orderBy(desc(testRuns.created_at));

    // 스위트별 run 그룹핑
    const runsPerSuite = new Map<string, Array<{ runId: string; status: string; createdAt: Date }>>();
    for (const r of recentRunRows) {
      if (!r.suiteId) continue;
      if (!runsPerSuite.has(r.suiteId)) runsPerSuite.set(r.suiteId, []);
      const arr = runsPerSuite.get(r.suiteId)!;
      if (arr.length < 5) {
        arr.push({ runId: r.runId, status: r.runStatus, createdAt: r.runCreatedAt });
      }
    }

    // 7) 최근 run들의 케이스 결과 집계
    const allRunIds = [...new Set(recentRunRows.map((r) => r.runId))];
    const runCaseCountMap = new Map<string, { passed: number; failed: number; blocked: number; skipped: number; total: number }>();
    if (allRunIds.length > 0) {
      const caseRunRows = await db
        .select({
          runId: testCaseRuns.test_run_id,
          status: testCaseRuns.status,
          cnt: count(),
        })
        .from(testCaseRuns)
        .where(inArray(testCaseRuns.test_run_id, allRunIds))
        .groupBy(testCaseRuns.test_run_id, testCaseRuns.status);

      for (const r of caseRunRows) {
        if (!r.runId) continue;
        if (!runCaseCountMap.has(r.runId)) {
          runCaseCountMap.set(r.runId, { passed: 0, failed: 0, blocked: 0, skipped: 0, total: 0 });
        }
        const c = runCaseCountMap.get(r.runId)!;
        const n = Number(r.cnt);
        c.total += n;
        if (r.status === 'pass') c.passed += n;
        else if (r.status === 'fail') c.failed += n;
        else if (r.status === 'blocked') c.blocked += n;
        else c.skipped += n;
      }
    }

    const deriveRunStatus = (runStatus: string, failed: number, blocked: number): RunStatus => {
      if (runStatus === 'IN_PROGRESS') return 'running';
      if (runStatus !== 'COMPLETED') return 'not_run';
      if (failed > 0) return 'failed';
      if (blocked > 0) return 'blocked';
      return 'passed';
    };

    // 조합
    const result: TestSuiteCard[] = suiteRows.map((row) => {
      const caseCount = caseCountMap.get(row.id) ?? 0;
      const includedPaths = [...(testTypeMap.get(row.id) ?? [])];
      const linkedMilestone = milestoneMap.get(row.id);
      const executionHistoryCount = runCountMap.get(row.id) ?? 0;

      const suiteRuns = runsPerSuite.get(row.id) ?? [];
      const recentRuns = suiteRuns.map((r) => {
        const counts = runCaseCountMap.get(r.runId) ?? { passed: 0, failed: 0, blocked: 0, skipped: 0, total: 0 };
        return {
          runId: r.runId,
          runAt: r.createdAt,
          status: deriveRunStatus(r.status, counts.failed, counts.blocked),
          passed: counts.passed,
          failed: counts.failed,
          blocked: counts.blocked,
          total: counts.total,
        };
      });

      const lastRun = suiteRuns[0]
        ? (() => {
            const counts = runCaseCountMap.get(suiteRuns[0].runId) ?? { passed: 0, failed: 0, blocked: 0, skipped: 0, total: 0 };
            return {
              runId: suiteRuns[0].runId,
              runAt: suiteRuns[0].createdAt,
              status: deriveRunStatus(suiteRuns[0].status, counts.failed, counts.blocked),
              counts,
              total: counts.total,
            };
          })()
        : undefined;

      return {
        id: row.id,
        projectId: row.project_id ?? '',
        title: row.name,
        description: row.description ?? undefined,
        sortOrder: row.sort_order ?? 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        archivedAt: row.archived_at ?? null,
        lifecycleStatus: row.lifecycle_status,
        tag: { label: '기본', tone: 'neutral' as const },
        includedPaths,
        caseCount,
        linkedMilestone,
        lastRun,
        executionHistoryCount,
        recentRuns,
      };
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching test suites with stats:', error);
    return {
      success: false,
      errors: { _testSuite: ['테스트 스위트를 불러오는 도중 오류가 발생했습니다.'] },
    };
  }
};

/**
 * 테스트 스위트를 아카이브합니다. (Soft Delete)
 */
export const archiveTestSuite = async (id: string): Promise<ActionResult<{ id: string }>> => {
  try {
    const db = getDatabase();

    // 접근 권한 확인
    const [existing] = await db.select({ projectId: testSuites.project_id }).from(testSuites).where(eq(testSuites.id, id)).limit(1);
    if (!existing?.projectId || !(await requireProjectAccess(existing.projectId))) {
      return { success: false, errors: { _testSuite: ['접근 권한이 없습니다.'] } };
    }

    const [archived] = await db
      .update(testSuites)
      .set({
        archived_at: new Date(),
        lifecycle_status: 'ARCHIVED',
        updated_at: new Date(),
      })
      .where(eq(testSuites.id, id))
      .returning();

    if (!archived) {
      return {
        success: false,
        errors: { _testSuite: ['테스트 스위트를 찾을 수 없습니다.'] },
      };
    }

    return {
      success: true,
      data: { id: archived.id },
      message: '테스트 스위트를 아카이브하였습니다.',
    };
  } catch (error) {
    console.error('Error archiving test suite:', error);
    return {
      success: false,
      errors: { _testSuite: ['테스트 스위트를 아카이브하는 도중 오류가 발생했습니다.'] },
    };
  }
};

/**
 * @deprecated Use archiveTestSuite instead
 */
export const deleteTestSuite = archiveTestSuite;