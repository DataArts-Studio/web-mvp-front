'use server';

import { CASE_MESSAGE_CODES } from '@/entities/test-case/model/message-codes';
import type { ActionResult } from '@/shared/types';
import * as Sentry from '@sentry/nextjs';
import { getDatabase, testCases } from '@testea/db';
import { sql } from 'drizzle-orm';

export const getProjectTags = async (projectId: string): Promise<ActionResult<string[]>> => {
  try {
    const db = getDatabase();

    // DB 레벨에서 중복 제거 + 빈도 정렬 (JS 후처리 제거)
    const rows = (await db.execute(sql`
      SELECT unnest(${testCases.tags}) AS tag, COUNT(*) AS freq
      FROM test_cases
      WHERE project_id = ${projectId} AND lifecycle_status = 'ACTIVE'
      GROUP BY tag ORDER BY freq DESC
    `)) as unknown as Array<{ tag: string; freq: number }>;

    const sortedTags = rows.map((r) => r.tag).filter(Boolean);

    return { success: true, data: sortedTags };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'getProjectTags' } });
    return {
      success: false,
      errors: { _tags: [CASE_MESSAGE_CODES.TAGS_LOAD_FAILED] },
    };
  }
};
