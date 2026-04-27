'use server';

import * as Sentry from '@sentry/nextjs';
import { getDatabase, testRuns } from '@/shared/lib/db';
import { eq } from 'drizzle-orm';
import type { ActionResult } from '@/shared/types';

export async function updateTestRunName(
  testRunId: string,
  name: string,
): Promise<ActionResult<{ id: string; name: string }>> {
  try {
    const trimmed = name.trim();
    if (!trimmed) {
      return {
        success: false,
        errors: { name: ['테스트 실행 이름을 입력해주세요.'] },
      };
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
