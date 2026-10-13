'use server';
import { requireProjectAccess } from '@/access/lib/require-access';
import { CreateTestRunSchema } from '@/entities/test-run';
import { assertRunResources } from '@/entities/test-run/api/assert-run-resources';
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
} from '@testea/db';
import { and, eq, inArray } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import { z } from 'zod';

type CreateRunInput = z.infer<typeof CreateTestRunSchema>;

const EMPTY_SCOPE_MESSAGE =
  '선택한 마일스톤에 실행할 케이스가 없습니다. 마일스톤에 스위트나 케이스를 추가한 뒤 다시 시도해주세요.';

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

  const storageError = await checkStorageLimit(project_id);
  if (storageError) return storageError;

  const db = getDatabase();

  try {
    const created = await db.transaction(async (tx) => {
      await assertRunResources(tx, project_id, { milestoneIds: [milestone_id] });

      // 휴지통 케이스는 새 실행에 넣지 않는다 (#377).
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
            eq(testCases.lifecycle_status, 'ACTIVE')
          )
        );

      const milestoneSuiteRows = await tx
        .select({
          test_suite_id: milestoneTestSuites.test_suite_id,
        })
        .from(milestoneTestSuites)
        .where(eq(milestoneTestSuites.milestone_id, milestone_id));

      const suiteIds = [
        ...new Set(milestoneSuiteRows.map((r) => r.test_suite_id).filter(Boolean)),
      ] as string[];

      await assertRunResources(tx, project_id, {
        suiteIds,
        caseIds: milestoneCaseRows.map((row) => row.test_case_id!),
      });

      const suiteCaseRows =
        suiteIds.length === 0
          ? []
          : await tx
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

      await assertRunResources(tx, project_id, {
        caseIds: suiteCaseRows.map((row) => row.id),
      });

      // 실행할 케이스가 하나도 없으면 0/0 으로 남는 빈 실행을 만들지 않는다 (#385).
      const scopeCaseIds = new Set([
        ...milestoneCaseRows.map((row) => row.test_case_id),
        ...suiteCaseRows.map((row) => row.id),
      ]);
      if (scopeCaseIds.size === 0) return null;

      // 1. Create the main test run entry and link the selected milestone
      // 마일스톤 목록·상세·대시보드 집계와 실행 출처 표시는 test_runs.milestone_id 를 읽으므로
      // 연결 테이블과 함께 반드시 채운다 (#373).
      const [run] = await tx
        .insert(testRuns)
        .values({
          project_id,
          milestone_id,
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
      if (suiteIds.length > 0) {
        // Link suites to the run
        const suiteLinks = suiteIds.map((suiteId) => ({
          test_run_id: run.id,
          test_suite_id: suiteId,
        }));
        await tx.insert(testRunSuites).values(suiteLinks).onConflictDoNothing();

        // Get individual test cases belonging to these suites
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

      return run;
    });

    if (!created) {
      return {
        success: false,
        errors: { formErrors: [EMPTY_SCOPE_MESSAGE], fieldErrors: {} } as FlatErrors,
      };
    }

    invalidateCache(INVALIDATE.runs);
    return { success: true, testRun: created };
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
