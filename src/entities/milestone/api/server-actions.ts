'use server';

import {
  CreateMilestone,
  Milestone,
  MilestoneDTO,
  toCreateMilestoneDTO,
  toMilestone,
} from '@/entities/milestone';
import { getDatabase, milestones, milestoneTestCases, milestoneTestSuites, testRunMilestones, testCaseRuns, testCases, testRunSuites } from '@/shared/lib/db';
import { ActionResult } from '@/shared/types';
import { and, eq, inArray } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';

type GetMilestonesParams = {
  projectId: string;
};

/**
 * 프로젝트의 모든 마일스톤을 가져옵니다.
 */
export const getMilestones = async ({
  projectId,
}: GetMilestonesParams): Promise<ActionResult<Milestone[]>> => {
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

    const result: Milestone[] = rows.map((row) => toMilestone(row as MilestoneDTO));

    return {
      success: true,

      data: result,
    };
  } catch (error) {
    console.error('Error fetching milestones:', error);

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
    console.error('Error fetching milestone:', error);
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
    console.error('Error creating milestone:', error);
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
    console.error('Error updating milestone:', error);
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
    const [archived] = await db
      .update(milestones)
      .set({
        archived_at: new Date(),
        lifecycle_status: 'ARCHIVED',
        updated_at: new Date(),
      })
      .where(eq(milestones.id, id))
      .returning();

    if (!archived) {
      return {
        success: false,
        errors: { _milestone: ['마일스톤 아카이브에 실패했습니다.'] },
      };
    }

    return {
      success: true,
      data: { id: archived.id },
      message: '마일스톤이 성공적으로 삭제되었습니다.',
    };
  } catch (error) {
    console.error('Error archiving milestone:', error);
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
      .select({ test_run_id: testRunMilestones.test_run_id })
      .from(testRunMilestones)
      .where(eq(testRunMilestones.milestone_id, milestoneId));

    for (const run of linkedRuns) {
      if (!run.test_run_id) continue;

      const existingRows = await db
        .select({ test_case_id: testCaseRuns.test_case_id })
        .from(testCaseRuns)
        .where(
          and(
            eq(testCaseRuns.test_run_id, run.test_run_id),
            inArray(testCaseRuns.test_case_id, testCaseIds)
          )
        );
      const existingSet = new Set(existingRows.map((r) => r.test_case_id));
      const newIds = testCaseIds.filter((id) => !existingSet.has(id));

      if (newIds.length > 0) {
        await db.insert(testCaseRuns).values(
          newIds.map((caseId) => ({
            id: uuidv7(),
            test_run_id: run.test_run_id!,
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
    console.error('Error adding test cases to milestone:', error);
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
    console.error('Error removing test case from milestone:', error);
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
      .select({ test_run_id: testRunMilestones.test_run_id })
      .from(testRunMilestones)
      .where(eq(testRunMilestones.milestone_id, milestoneId));

    if (linkedRuns.length > 0) {
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
          if (!run.test_run_id) continue;

          // Link suites to the run
          await db
            .insert(testRunSuites)
            .values(testSuiteIds.map((suiteId) => ({
              test_run_id: run.test_run_id!,
              test_suite_id: suiteId,
            })))
            .onConflictDoNothing();

          // Find which cases already exist in this run
          const existingRows = await db
            .select({ test_case_id: testCaseRuns.test_case_id })
            .from(testCaseRuns)
            .where(
              and(
                eq(testCaseRuns.test_run_id, run.test_run_id),
                inArray(testCaseRuns.test_case_id, caseIds)
              )
            );
          const existingSet = new Set(existingRows.map((r) => r.test_case_id));
          const newCaseIds = caseIds.filter((id) => !existingSet.has(id));

          if (newCaseIds.length > 0) {
            await db.insert(testCaseRuns).values(
              newCaseIds.map((caseId) => ({
                id: uuidv7(),
                test_run_id: run.test_run_id!,
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
    console.error('Error adding test suites to milestone:', error);
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
    console.error('Error removing test suite from milestone:', error);
    return {
      success: false,
      errors: { _milestone: ['테스트 스위트를 마일스톤에서 제거하는 도중 오류가 발생했습니다.'] },
    };
  }
};
