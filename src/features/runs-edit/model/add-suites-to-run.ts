'use server';

import {
  getDatabase,
  testRunSuites,
  testCaseRuns,
  suiteTestCases,
} from '@/shared/lib/db';
import { eq, and, inArray } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';

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

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Link suites to the run (ignore duplicates)
      const suiteLinks = suiteIds.map((suiteId) => ({
        test_run_id: runId,
        test_suite_id: suiteId,
      }));
      await tx.insert(testRunSuites).values(suiteLinks).onConflictDoNothing();

      // 2. Get test cases belonging to the selected suites (with suite_id for source tracking)
      const suiteCaseRows = await tx
        .select({
          test_case_id: suiteTestCases.test_case_id,
          suite_id: suiteTestCases.suite_id,
        })
        .from(suiteTestCases)
        .where(inArray(suiteTestCases.suite_id, suiteIds));

      const caseIdToSuite = new Map<string, string>();
      for (const row of suiteCaseRows) {
        if (row.test_case_id && row.suite_id) {
          caseIdToSuite.set(row.test_case_id, row.suite_id);
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
