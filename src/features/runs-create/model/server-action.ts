'use server';
import { CreateTestRunSchema } from '@/entities/test-run';
import { getDatabase, testRuns, testRunMilestones, testRunSuites, testCaseRuns, testCases, milestoneTestCases, milestoneTestSuites } from '@/shared/lib/db';
import { inArray, and, eq } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import { z } from 'zod';
import { requireProjectAccess } from '@/access/lib/require-access';

type FlatErrors = {
  formErrors: string[];
  fieldErrors: Record<string, string[] | undefined>;
};

type CreateRunInput = z.infer<typeof CreateTestRunSchema>;

export const createTestRunAction = async (input: CreateRunInput) => {
  const validation = CreateTestRunSchema.safeParse(input);

  if (!validation.success) {
    console.error('[createTestRunAction] Validation failed:', validation.error.flatten());
    return { success: false, errors: validation.error.flatten() as FlatErrors };
  }

  const { project_id, name, description, milestone_ids } = validation.data;

  // 접근 권한 확인
  const hasAccess = await requireProjectAccess(project_id);
  if (!hasAccess) {
    return {
      success: false,
      errors: { formErrors: ['접근 권한이 없습니다.'], fieldErrors: {} } as FlatErrors,
    };
  }

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

      // Track added case IDs to prevent duplicates across milestones
      const addedCaseIds = new Set<string>();

      // 2. Link milestones and create test case runs
      const milestoneLinks = milestone_ids.map((milestoneId) => ({
        test_run_id: run.id,
        milestone_id: milestoneId,
      }));
      await tx.insert(testRunMilestones).values(milestoneLinks);

      const milestoneCaseRows = await tx
        .select({
          test_case_id: milestoneTestCases.test_case_id,
          milestone_id: milestoneTestCases.milestone_id,
        })
        .from(milestoneTestCases)
        .where(inArray(milestoneTestCases.milestone_id, milestone_ids));

      const newMilestoneCaseRuns = milestoneCaseRows
        .filter((row) => row.test_case_id && row.milestone_id && !addedCaseIds.has(row.test_case_id))
        .map((row) => {
          addedCaseIds.add(row.test_case_id!);
          return {
            id: uuidv7(),
            test_run_id: run.id,
            test_case_id: row.test_case_id!,
            status: 'untested' as const,
            source_type: 'milestone' as const,
            source_id: row.milestone_id!,
            created_at: new Date(),
            updated_at: new Date(),
          };
        });

      if (newMilestoneCaseRuns.length > 0) {
        await tx.insert(testCaseRuns).values(newMilestoneCaseRuns);
      }

      // 3. Resolve suites linked to milestones and add their individual test cases
      const milestoneSuiteRows = await tx
        .select({
          test_suite_id: milestoneTestSuites.test_suite_id,
        })
        .from(milestoneTestSuites)
        .where(inArray(milestoneTestSuites.milestone_id, milestone_ids));

      const suiteIds = [...new Set(milestoneSuiteRows.map((r) => r.test_suite_id).filter(Boolean))] as string[];

      if (suiteIds.length > 0) {
        // Link suites to the run
        const suiteLinks = suiteIds.map((suiteId) => ({
          test_run_id: run.id,
          test_suite_id: suiteId,
        }));
        await tx.insert(testRunSuites).values(suiteLinks).onConflictDoNothing();

        // Get individual test cases belonging to these suites
        const suiteCaseRows = await tx
          .select({
            id: testCases.id,
            test_suite_id: testCases.test_suite_id,
          })
          .from(testCases)
          .where(
            and(
              inArray(testCases.test_suite_id, suiteIds),
              eq(testCases.lifecycle_status, 'ACTIVE')
            )
          );

        const newSuiteCaseRuns = suiteCaseRows
          .filter((row) => row.id && row.test_suite_id && !addedCaseIds.has(row.id))
          .map((row) => {
            addedCaseIds.add(row.id);
            return {
              id: uuidv7(),
              test_run_id: run.id,
              test_case_id: row.id,
              status: 'untested' as const,
              source_type: 'suite' as const,
              source_id: row.test_suite_id!,
              created_at: new Date(),
              updated_at: new Date(),
            };
          });

        if (newSuiteCaseRuns.length > 0) {
          await tx.insert(testCaseRuns).values(newSuiteCaseRuns);
        }
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
