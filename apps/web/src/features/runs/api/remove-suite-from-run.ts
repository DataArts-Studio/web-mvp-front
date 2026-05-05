'use server';

import * as Sentry from '@sentry/nextjs';
import { getDatabase, testRunSuites, testCaseRuns } from '@testea/db';
import { and, eq } from 'drizzle-orm';
import type { ActionResult } from '@/shared/types';

type RemoveSuiteParams = {
  testRunId: string;
  suiteId: string;
};

export async function removeSuiteFromRun({
  testRunId,
  suiteId,
}: RemoveSuiteParams): Promise<ActionResult<{ excluded: number }>> {
  try {
    const db = getDatabase();
    const now = new Date();

    // 1. test_run_suites 논리 삭제 (excluded_at 마킹)
    await db
      .update(testRunSuites)
      .set({ excluded_at: now })
      .where(
        and(
          eq(testRunSuites.test_run_id, testRunId),
          eq(testRunSuites.test_suite_id, suiteId)
        )
      );

    // 2. 해당 스위트에서 추가된 test_case_runs 논리 삭제
    const excluded = await db
      .update(testCaseRuns)
      .set({ excluded_at: now })
      .where(
        and(
          eq(testCaseRuns.test_run_id, testRunId),
          eq(testCaseRuns.source_type, 'suite'),
          eq(testCaseRuns.source_id, suiteId)
        )
      )
      .returning({ id: testCaseRuns.id });

    return { success: true, data: { excluded: excluded.length } };
  } catch (error) {
    console.error('[removeSuiteFromRun] Error:', error);
    Sentry.captureException(error, { extra: { action: 'removeSuiteFromRun', testRunId, suiteId } });
    return {
      success: false,
      errors: { _general: ['스위트 제거 중 오류가 발생했습니다.'] },
    };
  }
}
