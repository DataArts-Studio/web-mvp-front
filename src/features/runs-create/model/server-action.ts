'use server';
import { CreateTestRunSchema } from '@/entities/test-run';
import { getDatabase, testRuns, testRunMilestones, testRunSuites } from '@/shared/lib/db';
import { z } from 'zod';

type FlatErrors = {
  formErrors: string[];
  fieldErrors: Record<string, string[] | undefined>;
};

export const createTestRunAction = async (formData: FormData) => {
  const rawData = Object.fromEntries(formData.entries());

  // FormData can have multiple entries for the same key if they are sent as an array
  const suiteIds = formData.getAll('suite_ids[]');
  const milestoneIds = formData.getAll('milestone_ids[]');

  const dataToValidate = {
    ...rawData,
    suite_ids: suiteIds.length > 0 ? suiteIds : undefined,
    milestone_ids: milestoneIds.length > 0 ? milestoneIds : undefined,
  };

  const validation = CreateTestRunSchema.safeParse(dataToValidate);

  if (!validation.success) {
    console.error('[createTestRunAction] Validation failed:', validation.error.flatten());
    return { success: false, errors: validation.error.flatten() as FlatErrors };
  }

  const { project_id, name, description, suite_ids, milestone_ids } = validation.data;
  const db = getDatabase();

  try {
    const [newTestRun] = await db.transaction(async (tx) => {
      // 1. Create the main test run entry
      const [run] = await tx
        .insert(testRuns)
        .values({
          project_id,
          name,
          description,
        })
        .returning();

      // 2. Link suites if provided
      if (suite_ids && suite_ids.length > 0) {
        const suiteLinks = suite_ids.map((suiteId) => ({
          test_run_id: run.id,
          test_suite_id: suiteId,
        }));
        await tx.insert(testRunSuites).values(suiteLinks);
      }

      // 3. Link milestones if provided
      if (milestone_ids && milestone_ids.length > 0) {
        const milestoneLinks = milestone_ids.map((milestoneId) => ({
          test_run_id: run.id,
          milestone_id: milestoneId,
        }));
        await tx.insert(testRunMilestones).values(milestoneLinks);
      }

      return [run];
    });

    return { success: true, testRun: newTestRun };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[createTestRunAction] DB Error:', errorMessage, error);
    return {
      success: false,
      errors: {
        formErrors: [`테스트 실행 생성에 실패했습니다: ${errorMessage}`],
        fieldErrors: {},
      } as FlatErrors,
    };
  }
};
