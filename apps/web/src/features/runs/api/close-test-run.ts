'use server';

import { ACCESS_DENIED, canAccess } from '@/access/lib/project-scope';
import { lockRunStatus } from '@/entities/test-run/api/run-scope';
import { RUN_NOT_ACTIVE_MESSAGE } from '@/entities/test-run/model/schema';
import { INVALIDATE, invalidateCache } from '@/shared/lib/cache/tags';
import type { ActionResult } from '@/shared/types';
import * as Sentry from '@sentry/nextjs';
import { getDatabase, testRuns } from '@testea/db';
import { eq } from 'drizzle-orm';

/**
 * 미실행이 남은 실행을 그대로 완료한다 (06g).
 * 남은 케이스는 결과 없이 두고, closed_at 을 남겨 이후 상태 재계산이 진행 중으로 되돌리지 않게 한다.
 */
export async function closeTestRun(testRunId: string): Promise<ActionResult<{ id: string }>> {
  try {
    if (!(await canAccess('testRun', testRunId))) return ACCESS_DENIED;

    const db = getDatabase();
    const result = await db.transaction(async (tx) => {
      // 같은 실행의 결과 저장이 상태를 다시 계산하는 중이면 끝날 때까지 기다린다.
      await lockRunStatus(tx, [testRunId]);
      const [run] = await tx
        .select({ lifecycleStatus: testRuns.lifecycle_status })
        .from(testRuns)
        .where(eq(testRuns.id, testRunId))
        .limit(1);
      if (!run) return 'not_found' as const;
      if (run.lifecycleStatus !== 'ACTIVE') return 'not_active' as const;

      const now = new Date();
      await tx
        .update(testRuns)
        .set({ status: 'COMPLETED', closed_at: now, updated_at: now })
        .where(eq(testRuns.id, testRunId));
      return 'closed' as const;
    });

    if (result === 'not_found') {
      return { success: false, errors: { _general: ['테스트 실행을 찾을 수 없습니다.'] } };
    }
    if (result === 'not_active') {
      return { success: false, errors: { _general: [RUN_NOT_ACTIVE_MESSAGE] } };
    }

    invalidateCache(INVALIDATE.runs);
    return { success: true, data: { id: testRunId } };
  } catch (error) {
    console.error('[closeTestRun] Error:', error);
    Sentry.captureException(error, { extra: { action: 'closeTestRun', testRunId } });
    return {
      success: false,
      errors: { _general: ['테스트 실행을 완료하는 중 오류가 발생했습니다.'] },
    };
  }
}
