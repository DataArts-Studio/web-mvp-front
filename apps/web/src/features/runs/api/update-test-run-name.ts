'use server';

import { ACCESS_DENIED, canAccess } from '@/access/lib/project-scope';
import {
  RUN_NAME_MAX_LENGTH,
  RUN_NAME_MIN_LENGTH,
  RUN_NAME_TOO_LONG_MESSAGE,
  RUN_NAME_TOO_SHORT_MESSAGE,
} from '@/entities/test-run/model/schema';
import { INVALIDATE, invalidateCache } from '@/shared/lib/cache/tags';
import type { ActionResult } from '@/shared/types';
import * as Sentry from '@sentry/nextjs';
import { getDatabase, testRuns } from '@testea/db';
import { eq } from 'drizzle-orm';

export async function updateTestRunName(
  testRunId: string,
  name: string
): Promise<ActionResult<{ id: string; name: string }>> {
  try {
    if (!(await canAccess('testRun', testRunId))) return ACCESS_DENIED;

    const trimmed = name.trim();
    if (!trimmed) {
      return {
        success: false,
        errors: { name: ['테스트 실행 이름을 입력해주세요.'] },
      };
    }
    if (trimmed.length < RUN_NAME_MIN_LENGTH) {
      return { success: false, errors: { name: [RUN_NAME_TOO_SHORT_MESSAGE] } };
    }
    if (trimmed.length > RUN_NAME_MAX_LENGTH) {
      return { success: false, errors: { name: [RUN_NAME_TOO_LONG_MESSAGE] } };
    }

    const db = getDatabase();

    const [updated] = await db
      .update(testRuns)
      .set({ name: trimmed, updated_at: new Date() })
      .where(eq(testRuns.id, testRunId))
      .returning({ id: testRuns.id, name: testRuns.name });

    if (!updated) {
      return {
        success: false,
        errors: { _general: ['테스트 실행을 찾을 수 없습니다.'] },
      };
    }

    invalidateCache(INVALIDATE.runs);
    return { success: true, data: updated };
  } catch (error) {
    console.error('[updateTestRunName] Error:', error);
    Sentry.captureException(error, { extra: { action: 'updateTestRunName', testRunId } });
    return {
      success: false,
      errors: { _general: ['테스트 실행 이름 변경 중 오류가 발생했습니다.'] },
    };
  }
}
