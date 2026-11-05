'use server';

import { ACCESS_DENIED, canAccess } from '@/access/lib/project-scope';
import { RUN_NOT_ACTIVE_MESSAGE } from '@/entities/test-run/model/schema';
import { INVALIDATE, invalidateCache } from '@/shared/lib/cache/tags';
import type { ActionResult } from '@/shared/types';
import * as Sentry from '@sentry/nextjs';
import { getDatabase, testCaseRuns, testRuns } from '@testea/db';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { z } from 'zod';

const InputSchema = z.object({
  testRunId: z.string().uuid(),
  testCaseRunIds: z.array(z.string().uuid()).min(1).max(1000),
  reason: z.string().trim().min(1, '차단 사유를 입력해주세요.').max(2000),
});

/**
 * 같은 사유로 묶인 차단 케이스의 사유(메모)를 한 번에 고친다 (06h).
 * 이 실행의 제외되지 않은 차단 결과만 바꾸고, 결과와 기록 시각은 그대로 둔다.
 */
export async function updateBlockedReason(
  input: z.input<typeof InputSchema>
): Promise<ActionResult<{ updatedCount: number }>> {
  try {
    const parsed = InputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        errors: { _general: [parsed.error.issues[0]?.message ?? '입력이 올바르지 않습니다.'] },
      };
    }
    const { testRunId, testCaseRunIds, reason } = parsed.data;
    if (!(await canAccess('testRun', testRunId))) return ACCESS_DENIED;

    const db = getDatabase();
    const [run] = await db
      .select({ lifecycleStatus: testRuns.lifecycle_status })
      .from(testRuns)
      .where(eq(testRuns.id, testRunId))
      .limit(1);
    if (!run) {
      return { success: false, errors: { _general: ['테스트 실행을 찾을 수 없습니다.'] } };
    }
    if (run.lifecycleStatus !== 'ACTIVE') {
      return { success: false, errors: { _general: [RUN_NOT_ACTIVE_MESSAGE] } };
    }

    // 받은 ID 를 모두 이 실행의 차단 결과로 제한한다. 다른 실행의 ID 가 섞여 있으면 바뀌지 않는다.
    const updated = await db
      .update(testCaseRuns)
      .set({ comment: reason, updated_at: new Date() })
      .where(
        and(
          eq(testCaseRuns.test_run_id, testRunId),
          inArray(testCaseRuns.id, testCaseRunIds),
          eq(testCaseRuns.status, 'blocked'),
          isNull(testCaseRuns.excluded_at)
        )
      )
      .returning({ id: testCaseRuns.id });

    invalidateCache(INVALIDATE.runs);
    return { success: true, data: { updatedCount: updated.length } };
  } catch (error) {
    console.error('[updateBlockedReason] Error:', error);
    Sentry.captureException(error, { extra: { action: 'updateBlockedReason' } });
    return {
      success: false,
      errors: { _general: ['차단 사유를 저장하는 중 오류가 발생했습니다.'] },
    };
  }
}
