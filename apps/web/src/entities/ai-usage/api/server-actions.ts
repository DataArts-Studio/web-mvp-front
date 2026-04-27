'use server';

import * as Sentry from '@sentry/nextjs';
import { eq, sql, and, gte } from 'drizzle-orm';
import { getDatabase, aiUsageLogs } from '@/shared/lib/db';
import type { ActionResult } from '@/shared/types';

const FREE_MONTHLY_LIMIT = 50;

export const getMonthlyUsage = async (
  projectId: string,
): Promise<ActionResult<{ used: number; limit: number }>> => {
  try {
    const db = getDatabase();

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [result] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${aiUsageLogs.generated_count}), 0)`,
      })
      .from(aiUsageLogs)
      .where(
        and(
          eq(aiUsageLogs.project_id, projectId),
          gte(aiUsageLogs.created_at, startOfMonth),
        ),
      );

    return {
      success: true,
      data: {
        used: Number(result?.total ?? 0),
        limit: FREE_MONTHLY_LIMIT,
      },
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'getMonthlyUsage' } });
    return { success: false, errors: { _ai: ['사용량 조회에 실패했습니다.'] } };
  }
};

export const recordUsage = async (
  projectId: string,
  actionType: string,
  generatedCount: number,
): Promise<ActionResult<null>> => {
  try {
    const db = getDatabase();

    await db.insert(aiUsageLogs).values({
      project_id: projectId,
      action_type: actionType,
      generated_count: generatedCount,
    });

    return { success: true, data: null };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'recordUsage' } });
    return { success: false, errors: { _ai: ['사용량 기록에 실패했습니다.'] } };
  }
};
