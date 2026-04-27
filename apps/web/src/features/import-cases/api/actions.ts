'use server';

import * as Sentry from '@sentry/nextjs';
import { getDatabase, testCases } from '@testea/db';
import type { ActionResult } from '@/shared/types';
import { and, eq, sql } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import { requireProjectAccess } from '@/access/lib/require-access';
import { checkStorageLimit } from '@/shared/lib/storage/check-storage-limit';
import { importRequestSchema } from '../model/schema';
import type { ImportResult, ImportRowInput } from '../model/schema';

export async function importTestCases(input: {
  projectId: string;
  suiteId: string;
  rows: ImportRowInput[];
}): Promise<ActionResult<ImportResult>> {
  try {
    const validated = importRequestSchema.parse(input);

    const hasAccess = await requireProjectAccess(validated.projectId);
    if (!hasAccess) {
      return { success: false, errors: { _import: ['접근 권한이 없습니다.'] } };
    }

    const storageError = await checkStorageLimit(validated.projectId);
    if (storageError) return storageError;

    const db = getDatabase();

    // Get the current max display_id for this project
    const [maxResult] = await db
      .select({ max: sql<number>`COALESCE(MAX(${testCases.display_id}), 0)` })
      .from(testCases)
      .where(eq(testCases.project_id, validated.projectId));
    const nextDisplayId = (maxResult?.max ?? 0) + 1;

    // Get the current max sort_order
    const [maxOrder] = await db
      .select({ max: sql<number>`COALESCE(MAX(${testCases.sort_order}), 0)` })
      .from(testCases)
      .where(
        and(
          eq(testCases.project_id, validated.projectId),
          eq(testCases.lifecycle_status, 'ACTIVE'),
        ),
      );
    const currentOrder = (maxOrder?.max ?? 0) + 1;

    // Prepare batch insert data
    const insertData = validated.rows.map((row, index) => {
      const displayId = nextDisplayId + index;
      return {
        id: uuidv7(),
        project_id: validated.projectId,
        test_suite_id: validated.suiteId,
        name: row.name,
        display_id: displayId,
        case_key: `TC-${String(displayId).padStart(3, '0')}`,
        test_type: row.testType || null,
        tags: row.tags || [],
        pre_condition: row.preCondition || '',
        steps: row.steps || '',
        expected_result: row.expectedResult || '',
        sort_order: currentOrder + index,
        result_status: 'untested' as const,
        created_at: new Date(),
        updated_at: new Date(),
        archived_at: null,
        lifecycle_status: 'ACTIVE' as const,
      };
    });

    // Batch insert
    const result = await db.insert(testCases).values(insertData).returning();

    return {
      success: true,
      data: {
        total: validated.rows.length,
        success: result.length,
        failed: validated.rows.length - result.length,
        skipped: 0,
        errors: [],
      },
      message: `${result.length}건의 테스트케이스가 가져와졌습니다.`,
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'importTestCases' } });
    return {
      success: false,
      errors: {
        _import: ['가져오기에 실패했습니다. 다시 시도해주세요.'],
      },
    };
  }
}
