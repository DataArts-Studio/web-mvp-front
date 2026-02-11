'use server';

import {
  getDatabase,
  testRunSuites,
  testCaseRuns,
  testCases,
  testRuns,
} from '@/shared/lib/db';
import { eq, and, inArray } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import { requireProjectAccess } from '@/access/lib/require-access';

type AddSuitesToRunResult =
  | { success: true; addedCount: number }
  | { success: false; error: string };

export async function addSuitesToRunAction(
  runId: string,
  suiteIds: string[]
): Promise<AddSuitesToRunResult> {
  if (suiteIds.length === 0) {
    return { success: false, error: '추가할 스위트를 선택해주세요.' };
  }

  const db = getDatabase();

  // 접근 권한 확인
  const [run] = await db.select({ projectId: testRuns.project_id }).from(testRuns).where(eq(testRuns.id, runId)).limit(1);
  if (!run?.projectId || !(await requireProjectAccess(run.projectId))) {
    return { success: false, error: '접근 권한이 없습니다.' };
  }

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Link suites to the run (ignore duplicates)
      const suiteLinks = suiteIds.map((suiteId) => ({
        test_run_id: runId,
        test_suite_id: suiteId,
      }));
      await tx.insert(testRunSuites).values(suiteLinks).onConflictDoNothing();

      // 2. Get test cases belonging to the selected suites via testCases.test_suite_id
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

      const caseIdToSuite = new Map<string, string>();
      for (const row of suiteCaseRows) {
        if (row.id && row.test_suite_id) {
          caseIdToSuite.set(row.id, row.test_suite_id);
        }
      }

      const caseIds = Array.from(caseIdToSuite.keys());
      if (caseIds.length === 0) return 0;

      // 3. Find existing test case runs to avoid duplicates
      const existingRows = await tx
        .select({ test_case_id: testCaseRuns.test_case_id })
        .from(testCaseRuns)
        .where(
          and(
            eq(testCaseRuns.test_run_id, runId),
            inArray(testCaseRuns.test_case_id, caseIds)
          )
        );

      const existingCaseIds = new Set(existingRows.map((r) => r.test_case_id));
      const newCaseIds = caseIds.filter((id) => !existingCaseIds.has(id));

      if (newCaseIds.length === 0) return 0;

      // 4. Create test case run records for new cases with source tracking
      const newTestCaseRuns = newCaseIds.map((caseId) => ({
        id: uuidv7(),
        test_run_id: runId,
        test_case_id: caseId,
        status: 'untested' as const,
        source_type: 'suite' as const,
        source_id: caseIdToSuite.get(caseId),
        created_at: new Date(),
        updated_at: new Date(),
      }));

      await tx.insert(testCaseRuns).values(newTestCaseRuns);
      return newCaseIds.length;
    });

    return { success: true, addedCount: result };
  } catch (error) {
    console.error('[addSuitesToRunAction] Error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: `스위트 추가에 실패했습니다: ${message}` };
  }
}
