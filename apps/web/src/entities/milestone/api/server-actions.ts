'use server';

import { ACCESS_DENIED, canAccess } from '@/access/lib/project-scope';
import { requireProjectAccess } from '@/access/lib/require-access';
import {
  CreateMilestone,
  MILESTONE_DATE_RANGE_ERROR,
  Milestone,
  MilestoneDTO,
  MilestoneWithStats,
  getMilestoneDateError,
  toCreateMilestoneDTO,
  toMilestone,
} from '@/entities/milestone';
import { getMilestoneLatestResults } from '@/entities/milestone/api/latest-results';
import { summarizeMilestoneProgress } from '@/entities/milestone/model/progress';
import { assertRunResources } from '@/entities/test-run/api/assert-run-resources';
import { INVALIDATE, invalidateCache } from '@/shared/lib/cache/tags';
import { isDateRangeOrdered } from '@/shared/lib/date-only';
import { toValidName } from '@/shared/lib/normalize-name';
import { checkStorageLimit } from '@/shared/lib/storage/check-storage-limit';
import { ActionResult } from '@/shared/types';
import * as Sentry from '@sentry/nextjs';
import {
  getDatabase,
  milestoneTestCases,
  milestoneTestSuites,
  milestones,
  testCaseRuns,
  testCases,
  testRunSuites,
  testRuns,
} from '@testea/db';
import { and, eq, inArray } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import { z } from 'zod';

type GetMilestonesParams = {
  projectId: string;
};

/**
 * 프로젝트의 모든 마일스톤을 가져옵니다.
 */
const MILESTONE_NAME_MAX_LENGTH = 50;

export const getMilestones = async ({
  projectId,
}: GetMilestonesParams): Promise<ActionResult<MilestoneWithStats[]>> => {
  try {
    if (!(await canAccess('project', projectId))) return ACCESS_DENIED;

    const db = getDatabase();

    const rows = await db
      .select()
      .from(milestones)
      .where(and(eq(milestones.project_id, projectId), eq(milestones.lifecycle_status, 'ACTIVE')));

    if (rows.length === 0) {
      return { success: true, data: [] };
    }

    const milestoneIds = rows.map((r) => r.id);

    // 병렬 조회: 테스트 실행, 마일스톤-케이스, 마일스톤-스위트, 케이스별 최근 결과·마지막 실행 시점
    const [allRuns, allMtc, allMts, latestResults] = await Promise.all([
      db
        .select({ id: testRuns.id, milestone_id: testRuns.milestone_id })
        .from(testRuns)
        .where(
          and(inArray(testRuns.milestone_id, milestoneIds), eq(testRuns.lifecycle_status, 'ACTIVE'))
        ),
      // 휴지통 케이스는 마일스톤 케이스 수에서 뺀다. 실행 생성도 같은 기준이다 (#377, #385).
      db
        .select({
          milestone_id: milestoneTestCases.milestone_id,
          test_case_id: milestoneTestCases.test_case_id,
        })
        .from(milestoneTestCases)
        .innerJoin(testCases, eq(testCases.id, milestoneTestCases.test_case_id))
        .where(
          and(
            inArray(milestoneTestCases.milestone_id, milestoneIds),
            eq(testCases.lifecycle_status, 'ACTIVE')
          )
        ),
      db
        .select()
        .from(milestoneTestSuites)
        .where(inArray(milestoneTestSuites.milestone_id, milestoneIds)),
      getMilestoneLatestResults(db, milestoneIds),
    ]);

    // 스위트에 속한 케이스 조회
    const allSuiteIds = [
      ...new Set(allMts.map((m) => m.test_suite_id).filter(Boolean)),
    ] as string[];
    const suiteCases =
      allSuiteIds.length > 0
        ? await db
            .select({ id: testCases.id, test_suite_id: testCases.test_suite_id })
            .from(testCases)
            .where(
              and(
                inArray(testCases.test_suite_id, allSuiteIds),
                eq(testCases.lifecycle_status, 'ACTIVE')
              )
            )
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

    const result: MilestoneWithStats[] = rows.map((row) => {
      const base = toMilestone(row as MilestoneDTO);

      // 해당 마일스톤의 총 케이스 수 계산
      const directCaseIds = new Set(mtcByMilestone.get(row.id) || []);
      const suiteIdsForMs = mtsByMilestone.get(row.id) || [];
      for (const sid of suiteIdsForMs) {
        for (const cid of casesBySuite.get(sid) || []) {
          directCaseIds.add(cid);
        }
      }

      // 완료된 케이스: 케이스마다 이 마일스톤 실행의 가장 최근 결과 기준 (#418)
      const latest = latestResults.get(row.id);
      const progress = summarizeMilestoneProgress(directCaseIds, latest?.statuses ?? new Map());

      return {
        ...base,
        lastExecutedAt: latest?.lastExecutedAt ?? null,
        totalCases: progress.total,
        completedCases: progress.completed,
        progressRate: progress.progressPercent,
        runCount: (runsByMilestone.get(row.id) || []).length,
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
    if (!(await canAccess('milestone', id))) return ACCESS_DENIED;

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

    const name = toValidName(input.title, MILESTONE_NAME_MAX_LENGTH);
    if (!name) {
      return { success: false, errors: { _milestone: ['마일스톤 이름을 입력해주세요.'] } };
    }

    const dateError = getMilestoneDateError(input.startDate, input.endDate);
    if (dateError) {
      return { success: false, errors: { _milestone: [dateError] } };
    }

    const db = getDatabase();
    const dto = toCreateMilestoneDTO({ ...input, title: name });
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

    invalidateCache(INVALIDATE.milestones);
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
    const [existing] = await db
      .select({
        projectId: milestones.project_id,
        startDate: milestones.start_date,
        endDate: milestones.end_date,
      })
      .from(milestones)
      .where(eq(milestones.id, id))
      .limit(1);
    if (!existing?.projectId || !(await requireProjectAccess(existing.projectId))) {
      return { success: false, errors: { _milestone: ['접근 권한이 없습니다.'] } };
    }

    // input 데이터를 DTO 형태로 변환하거나 직접 set 절에 구성
    const setData: Record<string, unknown> = {
      updated_at: new Date(),
    };

    if (updateFields.title !== undefined) {
      const name = toValidName(updateFields.title, MILESTONE_NAME_MAX_LENGTH);
      if (!name) {
        return { success: false, errors: { _milestone: ['마일스톤 이름을 입력해주세요.'] } };
      }
      setData.name = name;
    }
    if (updateFields.description !== undefined) {
      setData.description = updateFields.description;
    }
    // 날짜는 'YYYY-MM-DD' 그대로 저장한다. 한쪽만 바꿔도 기존 값과 합쳐 기간 순서를 확인한다 (#381).
    const nextStartDate =
      updateFields.startDate !== undefined ? updateFields.startDate : existing.startDate;
    const nextEndDate =
      updateFields.endDate !== undefined ? updateFields.endDate : existing.endDate;
    const dateError = getMilestoneDateError(
      updateFields.startDate !== undefined ? updateFields.startDate : null,
      updateFields.endDate !== undefined ? updateFields.endDate : null
    );
    if (dateError) {
      return { success: false, errors: { _milestone: [dateError] } };
    }
    if (!isDateRangeOrdered(nextStartDate, nextEndDate)) {
      return { success: false, errors: { _milestone: [MILESTONE_DATE_RANGE_ERROR] } };
    }
    if (updateFields.startDate !== undefined) {
      setData.start_date = updateFields.startDate ?? null;
    }
    if (updateFields.endDate !== undefined) {
      setData.end_date = updateFields.endDate ?? null;
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

    invalidateCache(INVALIDATE.milestones);
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
    const [existing] = await db
      .select({ projectId: milestones.project_id })
      .from(milestones)
      .where(eq(milestones.id, id))
      .limit(1);
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

    invalidateCache(INVALIDATE.milestones);
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
  rawIds: string[]
): Promise<ActionResult<{ count: number }>> => {
  try {
    const db = getDatabase();

    // 접근 권한 확인
    const [ms] = await db
      .select({ projectId: milestones.project_id })
      .from(milestones)
      .where(eq(milestones.id, milestoneId))
      .limit(1);
    if (!ms?.projectId || !(await requireProjectAccess(ms.projectId))) {
      return { success: false, errors: { _milestone: ['접근 권한이 없습니다.'] } };
    }
    // 붙일 케이스가 모두 마일스톤과 같은 프로젝트 소속이어야 한다. 마일스톤에 연결된 실행으로
    // 곧바로 동기화되므로, 섞인 배열은 첫 쓰기 전에 통째로 거부한다.
    const parsedIds = z.array(z.string().uuid()).min(1).safeParse(rawIds);
    if (!parsedIds.success) {
      return { success: false, errors: { _milestone: ['유효한 연결 대상을 선택해주세요.'] } };
    }
    const testCaseIds = [...new Set(parsedIds.data)];
    try {
      await assertRunResources(db, ms.projectId, { caseIds: testCaseIds });
    } catch {
      return { success: false, errors: { _milestone: ['접근 권한이 없습니다.'] } };
    }

    const values = testCaseIds.map((testCaseId) => ({
      milestone_id: milestoneId,
      test_case_id: testCaseId,
    }));

    // 마일스톤 연결과 연결된 실행에 케이스를 넣는 일을 함께 반영한다 (#390).
    await db.transaction(async (tx) => {
      await tx.insert(milestoneTestCases).values(values).onConflictDoNothing();

      // Sync: add new cases to existing test runs linked to this milestone
      const linkedRuns = await tx
        .select({ id: testRuns.id })
        .from(testRuns)
        .where(eq(testRuns.milestone_id, milestoneId));

      for (const run of linkedRuns) {
        const existingRows = await tx
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
          await tx.insert(testCaseRuns).values(
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
    });

    invalidateCache(INVALIDATE.milestones);
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
    const [ms] = await db
      .select({ projectId: milestones.project_id })
      .from(milestones)
      .where(eq(milestones.id, milestoneId))
      .limit(1);
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

    invalidateCache(INVALIDATE.milestones);
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
  rawIds: string[]
): Promise<ActionResult<{ count: number }>> => {
  try {
    const db = getDatabase();

    // 접근 권한 확인
    const [ms] = await db
      .select({ projectId: milestones.project_id })
      .from(milestones)
      .where(eq(milestones.id, milestoneId))
      .limit(1);
    if (!ms?.projectId || !(await requireProjectAccess(ms.projectId))) {
      return { success: false, errors: { _milestone: ['접근 권한이 없습니다.'] } };
    }
    // 붙일 스위트가 모두 마일스톤과 같은 프로젝트 소속이어야 한다. 마일스톤에 연결된 실행으로
    // 곧바로 동기화되므로, 섞인 배열은 첫 쓰기 전에 통째로 거부한다.
    const parsedIds = z.array(z.string().uuid()).min(1).safeParse(rawIds);
    if (!parsedIds.success) {
      return { success: false, errors: { _milestone: ['유효한 연결 대상을 선택해주세요.'] } };
    }
    const testSuiteIds = [...new Set(parsedIds.data)];
    try {
      await assertRunResources(db, ms.projectId, { suiteIds: testSuiteIds });
    } catch {
      return { success: false, errors: { _milestone: ['접근 권한이 없습니다.'] } };
    }

    const values = testSuiteIds.map((testSuiteId) => ({
      milestone_id: milestoneId,
      test_suite_id: testSuiteId,
    }));

    // 마일스톤 연결과 연결된 실행에 스위트·케이스를 넣는 일을 함께 반영한다 (#390).
    await db.transaction(async (tx) => {
      await tx.insert(milestoneTestSuites).values(values).onConflictDoNothing();

      // Sync: resolve suite cases and add to existing test runs linked to this milestone
      const linkedRuns = await tx
        .select({ id: testRuns.id })
        .from(testRuns)
        .where(eq(testRuns.milestone_id, milestoneId));

      if (linkedRuns.length > 0) {
        // Always link suites to runs (even if suites are empty)
        for (const run of linkedRuns) {
          await tx
            .insert(testRunSuites)
            .values(
              testSuiteIds.map((suiteId) => ({
                test_run_id: run.id,
                test_suite_id: suiteId,
              }))
            )
            .onConflictDoNothing();
        }

        // Get individual test cases from the added suites
        // 스위트를 가리키는 다른 프로젝트 케이스가 있어도 실행에 섞이지 않게 프로젝트로 한 번 더 좁힌다.
        const suiteCaseRows = await tx
          .select({ id: testCases.id, test_suite_id: testCases.test_suite_id })
          .from(testCases)
          .where(
            and(
              inArray(testCases.test_suite_id, testSuiteIds),
              eq(testCases.project_id, ms.projectId),
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
            const existingRows = await tx
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
              await tx.insert(testCaseRuns).values(
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
    });

    invalidateCache(INVALIDATE.milestones);
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
    const [ms] = await db
      .select({ projectId: milestones.project_id })
      .from(milestones)
      .where(eq(milestones.id, milestoneId))
      .limit(1);
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

    invalidateCache(INVALIDATE.milestones);
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
