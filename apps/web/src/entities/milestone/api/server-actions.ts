'use server';

import * as Sentry from '@sentry/nextjs';
import {
  CreateMilestone,
  Milestone,
  MilestoneDTO,
  MilestoneWithStats,
  toCreateMilestoneDTO,
  toMilestone,
} from '@/entities/milestone';
import { getDatabase, milestones, milestoneTestCases, milestoneTestSuites, testRuns, testCaseRuns, testCases, testRunSuites } from '@/shared/lib/db';
import { ActionResult } from '@/shared/types';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import { requireProjectAccess } from '@/access/lib/require-access';
import { checkStorageLimit } from '@/shared/lib/db';

type GetMilestonesParams = {
  projectId: string;
};

/**
 * 프로젝트의 모든 마일스톤을 가져옵니다.
 */
export const getMilestones = async ({
  projectId,
}: GetMilestonesParams): Promise<ActionResult<MilestoneWithStats[]>> => {
  try {
    const db = getDatabase();

    const rows = await db
      .select()
      .from(milestones)
      .where(
        and(
          eq(milestones.project_id, projectId),
          eq(milestones.lifecycle_status, 'ACTIVE')
        )
      );

    if (rows.length === 0) {
      return { success: true, data: [] };
    }

    const milestoneIds = rows.map(r => r.id);

    // 병렬 조회: 테스트 실행, 마일스톤-케이스, 마일스톤-스위트
    const [allRuns, allMtc, allMts] = await Promise.all([
      db.select({ id: testRuns.id, milestone_id: testRuns.milestone_id })
        .from(testRuns)
        .where(and(inArray(testRuns.milestone_id, milestoneIds), eq(testRuns.lifecycle_status, 'ACTIVE'))),
      db.select()
        .from(milestoneTestCases)
        .where(inArray(milestoneTestCases.milestone_id, milestoneIds)),
      db.select()
        .from(milestoneTestSuites)
        .where(inArray(milestoneTestSuites.milestone_id, milestoneIds)),
    ]);

    // 스위트에 속한 케이스 조회
    const allSuiteIds = [...new Set(allMts.map(m => m.test_suite_id).filter(Boolean))] as string[];
    const suiteCases = allSuiteIds.length > 0
      ? await db.select({ id: testCases.id, test_suite_id: testCases.test_suite_id })
          .from(testCases)
          .where(and(inArray(testCases.test_suite_id, allSuiteIds), eq(testCases.lifecycle_status, 'ACTIVE')))
      : [];

    // 테스트 실행 결과 조회
    const allRunIds = allRuns.map(r => r.id);
    const allCaseRuns = allRunIds.length > 0
      ? await db.select({ test_run_id: testCaseRuns.test_run_id, test_case_id: testCaseRuns.test_case_id, status: testCaseRuns.status })
          .from(testCaseRuns)
          .where(and(inArray(testCaseRuns.test_run_id, allRunIds), isNull(testCaseRuns.excluded_at)))
      : [];

    // 마일스톤별 그룹핑
    const runsByMilestone = new Map<string, string[]>();
    for (const r of allRuns) {
      if (!r.milestone_id) continue;
      const list = runsByMilestone.get(r.milestone_id) || [];
      list.push(r.id);
      runsByMilestone.set(r.milestone_id, list);
    }

    const mtcByMilestone = new Map<string, string[]>();
    for (const m of allMtc) {
      if (!m.test_case_id) continue;
      const list = mtcByMilestone.get(m.milestone_id) || [];
      list.push(m.test_case_id);
      mtcByMilestone.set(m.milestone_id, list);
    }

    const mtsByMilestone = new Map<string, string[]>();
    for (const m of allMts) {
      if (!m.test_suite_id) continue;
      const list = mtsByMilestone.get(m.milestone_id) || [];
      list.push(m.test_suite_id);
      mtsByMilestone.set(m.milestone_id, list);
    }

    // 스위트별 케이스 매핑
    const casesBySuite = new Map<string, string[]>();
    for (const sc of suiteCases) {
      if (!sc.test_suite_id) continue;
      const list = casesBySuite.get(sc.test_suite_id) || [];
      list.push(sc.id);
      casesBySuite.set(sc.test_suite_id, list);
    }

    // 실행별 케이스 상태 매핑
    const caseRunsByRunId = new Map<string, Map<string, string>>();
    for (const cr of allCaseRuns) {
      if (!cr.test_run_id || !cr.test_case_id) continue;
      if (!caseRunsByRunId.has(cr.test_run_id)) caseRunsByRunId.set(cr.test_run_id, new Map());
      caseRunsByRunId.get(cr.test_run_id)!.set(cr.test_case_id, cr.status);
    }

    const result: MilestoneWithStats[] = rows.map((row) => {
      const base = toMilestone(row as MilestoneDTO);

      // 해당 마일스톤의 총 케이스 수 계산
      const directCaseIds = new Set(mtcByMilestone.get(row.id) || []);
      const suiteIdsForMs = mtsByMilestone.get(row.id) || [];
      for (const sid of suiteIdsForMs) {
        for (const cid of (casesBySuite.get(sid) || [])) {
          directCaseIds.add(cid);
        }
      }

      const totalCases = directCaseIds.size;

      // 완료된 케이스 계산 (마일스톤에 연결된 실행의 결과 기준)
      const runIds = runsByMilestone.get(row.id) || [];
      const caseStatusMap = new Map<string, string>();
      for (const runId of runIds) {
        const runCases = caseRunsByRunId.get(runId);
        if (!runCases) continue;
        for (const [caseId, status] of runCases) {
          if (directCaseIds.has(caseId)) {
            caseStatusMap.set(caseId, status);
          }
        }
      }
      const completedCases = Array.from(caseStatusMap.values()).filter(s => s !== 'untested').length;

      return {
        ...base,
        totalCases,
        completedCases,
        progressRate: totalCases > 0 ? Math.round((completedCases / totalCases) * 100) : 0,
        runCount: runIds.length,
      };
    });

    return { success: true, data: result };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'getMilestones' } });

    return {
      success: false,
      errors: { _milestone: ['마일스톤 목록을 불러오는 도중 오류가 발생했습니다.'] },
    };
  }
};

/**

 * ID로 특정 마일스톤을 조회합니다.

 */

export const getMilestoneById = async (id: string): Promise<ActionResult<Milestone>> => {
  try {
    const db = getDatabase();
    const [row] = await db.select().from(milestones).where(eq(milestones.id, id));

    if (!row) {
      return {
        success: false,
        errors: { _milestone: ['해당 마일스톤이 존재하지 않습니다.'] },
      };
    }

    return {
      success: true,
      data: toMilestone(row as MilestoneDTO),
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'getMilestoneById' } });
    return {
      success: false,
      errors: { _milestone: ['마일스톤을 불러오는 도중 오류가 발생했습니다.'] },
    };
  }
};

/**
 * 새로운 마일스톤을 생성합니다.
 */
export const createMilestone = async (input: CreateMilestone): Promise<ActionResult<Milestone>> => {
  try {
    const hasAccess = await requireProjectAccess(input.projectId);
    if (!hasAccess) {
      return { success: false, errors: { _milestone: ['접근 권한이 없습니다.'] } };
    }

    const storageError = await checkStorageLimit(input.projectId);
    if (storageError) return storageError;

    const db = getDatabase();
    const dto = toCreateMilestoneDTO(input);
    const id = uuidv7();

    const [inserted] = await db
      .insert(milestones)
      .values({
        id,
        ...dto,
        created_at: new Date(),
        updated_at: new Date(),
        archived_at: null,
        lifecycle_status: 'ACTIVE',
      })
      .returning();

    if (!inserted) {
      return {
        success: false,
        errors: { _milestone: ['마일스톤을 생성하는 도중 오류가 발생했습니다.'] },
      };
    }

    return {
      success: true,
      data: toMilestone(inserted as MilestoneDTO),
      message: '마일스톤을 생성하였습니다.',
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'createMilestone' } });
    return {
      success: false,
      errors: { _milestone: ['마일스톤을 생성하는 도중 오류가 발생했습니다.'] },
    };
  }
};

/**
 * 마일스톤 정보를 수정합니다.
 */
export const updateMilestone = async (
  input: { id: string } & Partial<CreateMilestone>
): Promise<ActionResult<Milestone>> => {
  try {
    const db = getDatabase();
    const { id, ...updateFields } = input;

    // 접근 권한 확인
    const [existing] = await db.select({ projectId: milestones.project_id }).from(milestones).where(eq(milestones.id, id)).limit(1);
    if (!existing?.projectId || !(await requireProjectAccess(existing.projectId))) {
      return { success: false, errors: { _milestone: ['접근 권한이 없습니다.'] } };
    }

    // input 데이터를 DTO 형태로 변환하거나 직접 set 절에 구성
    const setData: Record<string, unknown> = {
      updated_at: new Date(),
    };

    if (updateFields.title !== undefined) {
      setData.name = updateFields.title;
    }
    if (updateFields.description !== undefined) {
      setData.description = updateFields.description;
    }
    if (updateFields.startDate !== undefined) {
      // Date 객체를 ISO 문자열로 변환
      setData.start_date =
        updateFields.startDate instanceof Date
          ? updateFields.startDate.toISOString()
          : updateFields.startDate;
    }
    if (updateFields.endDate !== undefined) {
      // Date 객체를 ISO 문자열로 변환
      setData.end_date =
        updateFields.endDate instanceof Date
          ? updateFields.endDate.toISOString()
          : updateFields.endDate;
    }

    const [updated] = await db
      .update(milestones)
      .set(setData)
      .where(eq(milestones.id, id))
      .returning();

    if (!updated) {
      return {
        success: false,
        errors: { _milestone: ['마일스톤 수정에 실패했습니다.'] },
      };
    }

    return {
      success: true,
      data: toMilestone(updated as MilestoneDTO),
      message: '마일스톤이 수정되었습니다.',
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'updateMilestone' } });
    return {
      success: false,
      errors: { _milestone: ['마일스톤을 수정하는 도중 오류가 발생했습니다.'] },
    };
  }
};

/**
 * 마일스톤을 아카이브합니다. (Soft Delete)
 */
export const archiveMilestone = async (id: string): Promise<ActionResult<{ id: string }>> => {
  try {
    const db = getDatabase();

    // 접근 권한 확인
    const [existing] = await db.select({ projectId: milestones.project_id }).from(milestones).where(eq(milestones.id, id)).limit(1);
    if (!existing?.projectId || !(await requireProjectAccess(existing.projectId))) {
      return { success: false, errors: { _milestone: ['접근 권한이 없습니다.'] } };
    }

    const [archived] = await db
      .update(milestones)
      .set({
        archived_at: new Date(),
        lifecycle_status: 'DELETED',
        updated_at: new Date(),
      })
      .where(eq(milestones.id, id))
      .returning();

    if (!archived) {
      return {
        success: false,
        errors: { _milestone: ['마일스톤을 찾을 수 없습니다.'] },
      };
    }

    return {
      success: true,
      data: { id: archived.id },
      message: '마일스톤이 휴지통으로 이동되었습니다.',
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'archiveMilestone' } });
    return {
      success: false,
      errors: { _milestone: ['마일스톤을 삭제하는 도중 오류가 발생했습니다.'] },
    };
  }
};

/**
 * @deprecated Use archiveMilestone instead
 */
export const deleteMilestone = archiveMilestone;

/**
 * 마일스톤에 테스트 케이스를 추가합니다.
 */
export const addTestCasesToMilestone = async (
  milestoneId: string,
  testCaseIds: string[]
): Promise<ActionResult<{ count: number }>> => {
  try {
    const db = getDatabase();

    // 접근 권한 확인
    const [ms] = await db.select({ projectId: milestones.project_id }).from(milestones).where(eq(milestones.id, milestoneId)).limit(1);
    if (!ms?.projectId || !(await requireProjectAccess(ms.projectId))) {
      return { success: false, errors: { _milestone: ['접근 권한이 없습니다.'] } };
    }

    const values = testCaseIds.map((testCaseId) => ({
      milestone_id: milestoneId,
      test_case_id: testCaseId,
    }));

    await db
      .insert(milestoneTestCases)
      .values(values)
      .onConflictDoNothing();

    // Sync: add new cases to existing test runs linked to this milestone
    const linkedRuns = await db
      .select({ id: testRuns.id })
      .from(testRuns)
      .where(eq(testRuns.milestone_id, milestoneId));

    for (const run of linkedRuns) {
      const existingRows = await db
        .select({ test_case_id: testCaseRuns.test_case_id })
        .from(testCaseRuns)
        .where(
          and(
            eq(testCaseRuns.test_run_id, run.id),
            inArray(testCaseRuns.test_case_id, testCaseIds)
          )
        );
      const existingSet = new Set(existingRows.map((r) => r.test_case_id));
      const newIds = testCaseIds.filter((id) => !existingSet.has(id));

      if (newIds.length > 0) {
        await db.insert(testCaseRuns).values(
          newIds.map((caseId) => ({
            id: uuidv7(),
            test_run_id: run.id,
            test_case_id: caseId,
            status: 'untested' as const,
            source_type: 'milestone' as const,
            source_id: milestoneId,
            created_at: new Date(),
            updated_at: new Date(),
          }))
        );
      }
    }

    return {
      success: true,
      data: { count: testCaseIds.length },
      message: `${testCaseIds.length}개의 테스트 케이스가 마일스톤에 추가되었습니다.`,
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'addTestCasesToMilestone' } });
    return {
      success: false,
      errors: { _milestone: ['테스트 케이스를 마일스톤에 추가하는 도중 오류가 발생했습니다.'] },
    };
  }
};

/**
 * 마일스톤에서 테스트 케이스를 제거합니다.
 */
export const removeTestCaseFromMilestone = async (
  milestoneId: string,
  testCaseId: string
): Promise<ActionResult<{ id: string }>> => {
  try {
    const db = getDatabase();

    // 접근 권한 확인
    const [ms] = await db.select({ projectId: milestones.project_id }).from(milestones).where(eq(milestones.id, milestoneId)).limit(1);
    if (!ms?.projectId || !(await requireProjectAccess(ms.projectId))) {
      return { success: false, errors: { _milestone: ['접근 권한이 없습니다.'] } };
    }

    await db
      .delete(milestoneTestCases)
      .where(
        and(
          eq(milestoneTestCases.milestone_id, milestoneId),
          eq(milestoneTestCases.test_case_id, testCaseId)
        )
      );

    return {
      success: true,
      data: { id: testCaseId },
      message: '테스트 케이스가 마일스톤에서 제거되었습니다.',
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'removeTestCaseFromMilestone' } });
    return {
      success: false,
      errors: { _milestone: ['테스트 케이스를 마일스톤에서 제거하는 도중 오류가 발생했습니다.'] },
    };
  }
};

/**
 * 마일스톤에 테스트 스위트를 추가합니다.
 */
export const addTestSuitesToMilestone = async (
  milestoneId: string,
  testSuiteIds: string[]
): Promise<ActionResult<{ count: number }>> => {
  try {
    const db = getDatabase();

    // 접근 권한 확인
    const [ms] = await db.select({ projectId: milestones.project_id }).from(milestones).where(eq(milestones.id, milestoneId)).limit(1);
    if (!ms?.projectId || !(await requireProjectAccess(ms.projectId))) {
      return { success: false, errors: { _milestone: ['접근 권한이 없습니다.'] } };
    }

    const values = testSuiteIds.map((testSuiteId) => ({
      milestone_id: milestoneId,
      test_suite_id: testSuiteId,
    }));

    await db
      .insert(milestoneTestSuites)
      .values(values)
      .onConflictDoNothing();

    // Sync: resolve suite cases and add to existing test runs linked to this milestone
    const linkedRuns = await db
      .select({ id: testRuns.id })
      .from(testRuns)
      .where(eq(testRuns.milestone_id, milestoneId));

    if (linkedRuns.length > 0) {
      // Always link suites to runs (even if suites are empty)
      for (const run of linkedRuns) {
        await db
          .insert(testRunSuites)
          .values(testSuiteIds.map((suiteId) => ({
            test_run_id: run.id,
            test_suite_id: suiteId,
          })))
          .onConflictDoNothing();
      }

      // Get individual test cases from the added suites
      const suiteCaseRows = await db
        .select({ id: testCases.id, test_suite_id: testCases.test_suite_id })
        .from(testCases)
        .where(
          and(
            inArray(testCases.test_suite_id, testSuiteIds),
            eq(testCases.lifecycle_status, 'ACTIVE')
          )
        );

      if (suiteCaseRows.length > 0) {
        const caseIdToSuite = new Map<string, string>();
        for (const row of suiteCaseRows) {
          if (row.id && row.test_suite_id) {
            caseIdToSuite.set(row.id, row.test_suite_id);
          }
        }
        const caseIds = Array.from(caseIdToSuite.keys());

        for (const run of linkedRuns) {
          // Find which cases already exist in this run
          const existingRows = await db
            .select({ test_case_id: testCaseRuns.test_case_id })
            .from(testCaseRuns)
            .where(
              and(
                eq(testCaseRuns.test_run_id, run.id),
                inArray(testCaseRuns.test_case_id, caseIds)
              )
            );
          const existingSet = new Set(existingRows.map((r) => r.test_case_id));
          const newCaseIds = caseIds.filter((id) => !existingSet.has(id));

          if (newCaseIds.length > 0) {
            await db.insert(testCaseRuns).values(
              newCaseIds.map((caseId) => ({
                id: uuidv7(),
                test_run_id: run.id,
                test_case_id: caseId,
                status: 'untested' as const,
                source_type: 'suite' as const,
                source_id: caseIdToSuite.get(caseId)!,
                created_at: new Date(),
                updated_at: new Date(),
              }))
            );
          }
        }
      }
    }

    return {
      success: true,
      data: { count: testSuiteIds.length },
      message: `${testSuiteIds.length}개의 테스트 스위트가 마일스톤에 추가되었습니다.`,
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'addTestSuitesToMilestone' } });
    return {
      success: false,
      errors: { _milestone: ['테스트 스위트를 마일스톤에 추가하는 도중 오류가 발생했습니다.'] },
    };
  }
};

/**
 * 마일스톤에서 테스트 스위트를 제거합니다.
 */
export const removeTestSuiteFromMilestone = async (
  milestoneId: string,
  testSuiteId: string
): Promise<ActionResult<{ id: string }>> => {
  try {
    const db = getDatabase();

    // 접근 권한 확인
    const [ms] = await db.select({ projectId: milestones.project_id }).from(milestones).where(eq(milestones.id, milestoneId)).limit(1);
    if (!ms?.projectId || !(await requireProjectAccess(ms.projectId))) {
      return { success: false, errors: { _milestone: ['접근 권한이 없습니다.'] } };
    }

    await db
      .delete(milestoneTestSuites)
      .where(
        and(
          eq(milestoneTestSuites.milestone_id, milestoneId),
          eq(milestoneTestSuites.test_suite_id, testSuiteId)
        )
      );

    return {
      success: true,
      data: { id: testSuiteId },
      message: '테스트 스위트가 마일스톤에서 제거되었습니다.',
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'removeTestSuiteFromMilestone' } });
    return {
      success: false,
      errors: { _milestone: ['테스트 스위트를 마일스톤에서 제거하는 도중 오류가 발생했습니다.'] },
    };
  }
};
