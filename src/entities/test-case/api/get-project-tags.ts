'use server';

import * as Sentry from '@sentry/nextjs';
import { getDatabase, testCases } from '@/shared/lib/db';
import type { ActionResult } from '@/shared/types';
import { and, eq, sql } from 'drizzle-orm';

export const getProjectTags = async (projectId: string): Promise<ActionResult<string[]>> => {
  try {
    const db = getDatabase();
    const rows = await db
      .select({
        tag: sql<string>`unnest(${testCases.tags})`,
      })
      .from(testCases)
      .where(
        and(
          eq(testCases.project_id, projectId),
          eq(testCases.lifecycle_status, 'ACTIVE')
        )
      );

    const tagCounts = new Map<string, number>();
    for (const row of rows) {
      if (row.tag) {
        const count = tagCounts.get(row.tag) ?? 0;
        tagCounts.set(row.tag, count + 1);
      }
    }

    const sortedTags = [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);

    return { success: true, data: sortedTags };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'getProjectTags' } });
    return {
      success: false,
      errors: { _tags: ['태그를 불러오는 도중 오류가 발생했습니다.'] },
    };
  }
};
