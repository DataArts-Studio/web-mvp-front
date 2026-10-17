'use server';

import { belongsToProject } from '@/access/lib/project-scope';
import { requireProjectAccess } from '@/access/lib/require-access';
import { lockCaseNumbers, toCaseKey } from '@/entities/test-case/api/case-number-lock';
import { csvTextToSteps } from '@/entities/test-case/model/csv-columns';
import { INVALIDATE, invalidateCache } from '@/shared/lib/cache/tags';
import { checkStorageLimit } from '@/shared/lib/storage/check-storage-limit';
import type { ActionResult } from '@/shared/types';
import * as Sentry from '@sentry/nextjs';
import { getDatabase, testCases } from '@testea/db';
import { and, eq, sql } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';

import { importRequestSchema, importRowSchema } from '../model/schema';
import type { ImportResult, ImportRowInput, NumberedImportRow } from '../model/schema';

const ROW_INSERT_FAILED = '저장하지 못했습니다.';

export async function importTestCases(input: {
  projectId: string;
  suiteId: string;
  rows: NumberedImportRow[];
}): Promise<ActionResult<ImportResult>> {
  try {
    const parsedRequest = importRequestSchema.safeParse(input);
    if (!parsedRequest.success) {
      const message =
        parsedRequest.error.issues[0]?.message ?? '가져올 데이터가 올바르지 않습니다.';
      return { success: false, errors: { _import: [message] } };
    }
    const validated = parsedRequest.data;

    const hasAccess = await requireProjectAccess(validated.projectId);
    if (!hasAccess) {
      return { success: false, errors: { _import: ['접근 권한이 없습니다.'] } };
    }
    // 대상 스위트가 같은 프로젝트 소속인지 확인한다 (남의 스위트에 케이스 매달기 차단).
    if (!(await belongsToProject('testSuite', validated.suiteId, validated.projectId))) {
      return { success: false, errors: { _import: ['접근 권한이 없습니다.'] } };
    }

    const storageError = await checkStorageLimit(validated.projectId);
    if (storageError) return storageError;

    // 행마다 따로 검증한다. 한 행이 잘못돼도 나머지는 가져온다 (#382).
    const errors: ImportResult['errors'] = [];
    const validRows: Array<{ row: number; data: ImportRowInput }> = [];
    for (const item of validated.rows) {
      const { row, ...rest } = item;
      const parsed = importRowSchema.safeParse(rest);
      if (parsed.success) {
        validRows.push({ row, data: parsed.data });
      } else {
        errors.push({ row, message: parsed.error.issues.map((issue) => issue.message).join(', ') });
      }
    }

    const db = getDatabase();
    let insertedCount = 0;

    if (validRows.length > 0) {
      // 번호 계산부터 삽입까지 한 트랜잭션에서 프로젝트 번호를 잠근 채 한다 (#390).
      insertedCount = await db.transaction(async (tx) => {
        await lockCaseNumbers(tx, validated.projectId);
        const [maxResult] = await tx
          .select({ max: sql<number>`COALESCE(MAX(${testCases.display_id}), 0)` })
          .from(testCases)
          .where(eq(testCases.project_id, validated.projectId));
        const nextDisplayId = (maxResult?.max ?? 0) + 1;

        const [maxOrder] = await tx
          .select({ max: sql<number>`COALESCE(MAX(${testCases.sort_order}), 0)` })
          .from(testCases)
          .where(
            and(
              eq(testCases.project_id, validated.projectId),
              eq(testCases.lifecycle_status, 'ACTIVE')
            )
          );
        const currentOrder = (maxOrder?.max ?? 0) + 1;

        const toInsertValue = (data: ImportRowInput, offset: number) => {
          const displayId = nextDisplayId + offset;
          return {
            id: uuidv7(),
            project_id: validated.projectId,
            test_suite_id: validated.suiteId,
            name: data.name,
            display_id: displayId,
            case_key: toCaseKey(displayId),
            test_type: data.testType || null,
            tags: data.tags || [],
            pre_condition: data.preCondition || '',
            // 번호 목록 텍스트를 단계 저장 형식(JSON 배열)으로 되돌린다.
            steps: csvTextToSteps(data.steps || ''),
            expected_result: data.expectedResult || '',
            sort_order: currentOrder + offset,
            result_status: 'untested' as const,
            created_at: new Date(),
            updated_at: new Date(),
            archived_at: null,
            lifecycle_status: 'ACTIVE' as const,
          };
        };

        try {
          // 대부분은 한 번에 넣는다. 실패해도 트랜잭션 전체가 깨지지 않게 세이브포인트 안에서 넣는다.
          const inserted = await tx.transaction((sp) =>
            sp
              .insert(testCases)
              .values(validRows.map((item, index) => toInsertValue(item.data, index)))
              .returning({ id: testCases.id })
          );
          return inserted.length;
        } catch (batchError) {
          // 한 번에 넣기가 실패하면 행마다 다시 시도해 어느 행이 문제인지 알린다.
          Sentry.captureException(batchError, { extra: { action: 'importTestCases.batch' } });
          let count = 0;
          for (const item of validRows) {
            try {
              await tx.transaction((sp) =>
                sp.insert(testCases).values(toInsertValue(item.data, count))
              );
              count += 1;
            } catch {
              errors.push({ row: item.row, message: ROW_INSERT_FAILED });
            }
          }
          return count;
        }
      });
    }

    if (insertedCount > 0) invalidateCache(INVALIDATE.cases);
    errors.sort((a, b) => a.row - b.row);

    return {
      success: true,
      data: {
        total: validated.rows.length,
        success: insertedCount,
        failed: errors.length,
        skipped: 0,
        errors,
      },
      message: `${insertedCount}건의 테스트케이스가 가져와졌습니다.`,
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
