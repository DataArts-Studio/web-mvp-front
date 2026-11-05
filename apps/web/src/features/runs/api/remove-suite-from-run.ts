'use server';

import { ACCESS_DENIED, canAccess } from '@/access/lib/project-scope';
import { recomputeTestRunStatus } from '@/entities/test-run/api/run-scope';
import { INVALIDATE, invalidateCache } from '@/shared/lib/cache/tags';
import type { ActionResult } from '@/shared/types';
import * as Sentry from '@sentry/nextjs';
import { getDatabase, testCaseRuns, testRunSuites } from '@testea/db';
import { and, eq, isNull } from 'drizzle-orm';

type RemoveSuiteParams = {
  testRunId: string;
  suiteId: string;
};

export async function removeSuiteFromRun({
  testRunId,
  suiteId,
}: RemoveSuiteParams): Promise<ActionResult<{ excluded: number }>> {
  try {
    if (!(await canAccess('testRun', testRunId))) return ACCESS_DENIED;

    const db = getDatabase();
    const now = new Date();

    // 스위트 연결과 그 스위트로 들어온 케이스를 함께 제외하고, 남은 범위로 상태를 다시 계산한다 (#376).
    // 기록한 결과는 지우지 않고 제외만 표시하므로 스위트를 다시 추가하면 그대로 돌아온다 (#375).
    const excluded = await db.transaction(async (tx) => {
      await tx
        .update(testRunSuites)
        .set({ excluded_at: now })
        .where(
          and(eq(testRunSuites.test_run_id, testRunId), eq(testRunSuites.test_suite_id, suiteId))
        );

      const rows = await tx
        .update(testCaseRuns)
        .set({ excluded_at: now })
        .where(
          and(
            eq(testCaseRuns.test_run_id, testRunId),
            eq(testCaseRuns.source_type, 'suite'),
            eq(testCaseRuns.source_id, suiteId),
            isNull(testCaseRuns.excluded_at)
          )
        )
        .returning({ id: testCaseRuns.id });

      await recomputeTestRunStatus(tx, testRunId);
      return rows;
    });

    invalidateCache(INVALIDATE.runs);
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
