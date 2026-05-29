'use server';

import type { ActionResult } from '@/shared/types';
import * as Sentry from '@sentry/nextjs';
import { aiUsageLogs, getDatabase } from '@testea/db';
import { and, eq, gte, sql } from 'drizzle-orm';

const FREE_MONTHLY_LIMIT = 50;

export const getMonthlyUsage = async (
  projectId: string
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
      .where(and(eq(aiUsageLogs.project_id, projectId), gte(aiUsageLogs.created_at, startOfMonth)));

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

export interface AttachmentUsageMeta {
  type: 'pdf' | 'markdown';
  sizeBytes: number;
  /** PDF 일 때만 값 있음. Markdown 은 null. */
  pageCount: number | null;
  charCount: number;
}

export const recordUsage = async (
  projectId: string,
  actionType: string,
  generatedCount: number,
  attachment?: AttachmentUsageMeta
): Promise<ActionResult<null>> => {
  try {
    const db = getDatabase();

    await db.insert(aiUsageLogs).values({
      project_id: projectId,
      action_type: actionType,
      generated_count: generatedCount,
      attached_file_type: attachment?.type ?? null,
      attached_file_size_bytes: attachment?.sizeBytes ?? null,
      attached_file_page_count: attachment?.pageCount ?? null,
      attached_file_char_count: attachment?.charCount ?? null,
    });

    return { success: true, data: null };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'recordUsage' } });
    return { success: false, errors: { _ai: ['사용량 기록에 실패했습니다.'] } };
  }
};
