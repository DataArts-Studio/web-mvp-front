'use server';

import * as Sentry from '@sentry/nextjs';
import { getDatabase, testRuns } from '@testea/db';
import { eq } from 'drizzle-orm';
import type { ActionResult } from '@/shared/types';

export async function deleteTestRun(testRunId: string): Promise<ActionResult<{ id: string }>> {
  try {
    const db = getDatabase();

    const [archived] = await db
      .update(testRuns)
      .set({ lifecycle_status: 'ARCHIVED', archived_at: new Date() })
      .where(eq(testRuns.id, testRunId))
      .returning({ id: testRuns.id });

    if (!archived) {
      return {
        success: false,
        errors: { _general: ['삭제할 테스트 실행을 찾을 수 없습니다.'] },
      };
    }

    return { success: true, data: { id: archived.id } };
  } catch (error) {
    console.error('[deleteTestRun] Error:', error);
    Sentry.captureException(error, { extra: { action: 'deleteTestRun', testRunId } });
    return {
      success: false,
      errors: { _general: ['테스트 실행 삭제 중 오류가 발생했습니다.'] },
    };
  }
}
