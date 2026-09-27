'use server';
import { allBelongToProject } from '@/access/lib/project-scope';
import { requireProjectAccess } from '@/access/lib/require-access';
import { CreateTestRunSchema } from '@/entities/test-run';
import { INVALIDATE, invalidateCache } from '@/shared/lib/cache/tags';
import { checkStorageLimit } from '@/shared/lib/storage/check-storage-limit';
import type { FlatErrors } from '@/shared/types';
import * as Sentry from '@sentry/nextjs';
import {
  getDatabase,
  milestoneTestCases,
  milestoneTestSuites,
  testCaseRuns,
  testCases,
  testRunMilestones,
  testRunSuites,
  testRuns,
  testSuites,
} from '@testea/db';
import { and, eq, inArray } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import { z } from 'zod';

type CreateRunInput = z.infer<typeof CreateTestRunSchema>;

export const createTestRunAction = async (input: CreateRunInput) => {
  const validation = CreateTestRunSchema.safeParse(input);

  if (!validation.success) {
    return { success: false, errors: validation.error.flatten() as FlatErrors };
  }

  const { project_id, name, description, milestone_id } = validation.data;

  // 접근 권한 확인
  const hasAccess = await requireProjectAccess(project_id);
  if (!hasAccess) {
    return {
      success: false,
      errors: { formErrors: ['접근 권한이 없습니다.'], fieldErrors: {} } as FlatErrors,
    };
  }

  // 연결할 마일스톤이 같은 프로젝트 소속인지 쓰기 전에 확인한다. 다른 프로젝트 마일스톤을
  // 넣으면 그 프로젝트의 케이스가 이 실행으로 복사돼 내용이 노출된다.
  if (!(await allBelongToProject('milestone', [milestone_id], project_id))) {
    return {
      success: false,
      errors: { formErrors: ['접근 권한이 없습니다.'], fieldErrors: {} } as FlatErrors,
    };
  }

  const storageError = await checkStorageLimit(project_id);
  if (storageError) return storageError;

  const db = getDatabase();

  try {
    const [newTestRun] = await db.transaction(async (tx) => {
      // 1. Create the main test run entry and link the selected milestone
      const [run] = await tx
        .insert(testRuns)
        .values({
          project_id,
          name,
          description,
        })
        .returning();

      await tx
        .insert(testRunMilestones)
        .values({
          test_run_id: run.id,
          milestone_id,
        })
        .onConflictDoNothing();

      // Track added case IDs to prevent duplicates
      const addedCaseIds = new Set<string>();

      // 2. Resolve test cases from milestone

      // 마일스톤에 걸린 케이스 중 이 프로젝트 소속만 가져온다(과거 오염된 연결 방어).
      const milestoneCaseRows = await tx
        .select({
          test_case_id: milestoneTestCases.test_case_id,
          milestone_id: milestoneTestCases.milestone_id,
        })
        .from(milestoneTestCases)
        .innerJoin(testCases, eq(testCases.id, milestoneTestCases.test_case_id))
        .where(
          and(
            eq(milestoneTestCases.milestone_id, milestone_id),
            eq(testCases.project_id, project_id)
          )
        );

      const newMilestoneCaseRuns = milestoneCaseRows
        .filter(
          (row) => row.test_case_id && row.milestone_id && !addedCaseIds.has(row.test_case_id)
        )
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
        .innerJoin(testSuites, eq(testSuites.id, milestoneTestSuites.test_suite_id))
        .where(
          and(
            eq(milestoneTestSuites.milestone_id, milestone_id),
            eq(testSuites.project_id, project_id)
          )
        );

      const suiteIds = [
        ...new Set(milestoneSuiteRows.map((r) => r.test_suite_id).filter(Boolean)),
      ] as string[];

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
              eq(testCases.project_id, project_id),
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

    invalidateCache(INVALIDATE.runs);
    return { success: true, testRun: newTestRun };
  } catch (error) {
    console.error('[createTestRunAction] Error:', error);
    Sentry.captureException(error, {
      extra: { action: 'createTestRunAction', project_id, milestone_id, name },
    });
    return {
      success: false,
      errors: {
        formErrors: ['테스트 실행 생성에 실패했습니다. 잠시 후 다시 시도해주세요.'],
        fieldErrors: {},
      } as FlatErrors,
    };
  }
};
