'use server';

import * as Sentry from '@sentry/nextjs';
import { getDatabase, testCases } from '@/shared/lib/db';
import type { ActionResult } from '@/shared/types';
import { sql } from 'drizzle-orm';

export const getProjectTags = async (projectId: string): Promise<ActionResult<string[]>> => {
  try {
    const db = getDatabase();

    // DB 레벨에서 중복 제거 + 빈도 정렬 (JS 후처리 제거)
    const rows = await db.execute(sql`
      SELECT unnest(${testCases.tags}) AS tag, COUNT(*) AS freq
      FROM test_cases
      WHERE project_id = ${projectId} AND lifecycle_status = 'ACTIVE'
      GROUP BY tag ORDER BY freq DESC
    `) as unknown as Array<{ tag: string; freq: number }>;

    const sortedTags = rows.map((r) => r.tag).filter(Boolean);

    return { success: true, data: sortedTags };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'getProjectTags' } });
    return {
      success: false,
      errors: { _tags: ['태그를 불러오는 도중 오류가 발생했습니다.'] },
    };
  }
};
