'use server';

import { requireProjectAccess } from '@/access/lib/require-access';
import { recomputeTestRunStatus } from '@/entities/test-run/api/run-scope';
import { RUN_NOT_ACTIVE_MESSAGE } from '@/entities/test-run/model/schema';
import { INVALIDATE, invalidateCache } from '@/shared/lib/cache/tags';
import { ActionResult } from '@/shared/types';
import * as Sentry from '@sentry/nextjs';
import { type TestCaseRunStatus, getDatabase, testCaseRuns, testRuns } from '@testea/db';
import { and, eq, inArray } from 'drizzle-orm';

interface BulkUpdateInput {
  testCaseRunIds: string[];
  status: TestCaseRunStatus;
  comment?: string | null;
}

interface BulkUpdateResult {
  updatedCount: number;
}

export async function bulkUpdateTestCaseRunStatus(
  input: BulkUpdateInput
): Promise<ActionResult<BulkUpdateResult>> {
  try {
    if (input.testCaseRunIds.length === 0) {
      return { success: false, errors: { _general: ['선택된 케이스가 없습니다.'] } };
    }

    const db = getDatabase();

    // 접근 권한 확인: 첫 번째 케이스로 프로젝트 권한 확인
    const [firstCaseRun] = await db
      .select({ testRunId: testCaseRuns.test_run_id })
      .from(testCaseRuns)
      .where(eq(testCaseRuns.id, input.testCaseRunIds[0]))
      .limit(1);

    if (!firstCaseRun?.testRunId) {
      return { success: false, errors: { _general: ['테스트 케이스 실행을 찾을 수 없습니다.'] } };
    }

    const [run] = await db
      .select({ projectId: testRuns.project_id, lifecycleStatus: testRuns.lifecycle_status })
      .from(testRuns)
      .where(eq(testRuns.id, firstCaseRun.testRunId))
      .limit(1);

    if (!run?.projectId || !(await requireProjectAccess(run.projectId))) {
      return { success: false, errors: { _general: ['접근 권한이 없습니다.'] } };
    }
    if (run.lifecycleStatus !== 'ACTIVE') {
      return { success: false, errors: { _general: [RUN_NOT_ACTIVE_MESSAGE] } };
    }

    const now = new Date();

    // 일괄 업데이트 (IDOR 방지: 인가된 프로젝트에 속한 run 의 케이스 실행만 갱신)
    // 결과 저장과 실행 상태 재계산을 함께 반영한다 (#390).
    const updated = await db.transaction(async (tx) => {
      const rows = await tx
        .update(testCaseRuns)
        .set({
          status: input.status,
          ...(input.comment !== undefined ? { comment: input.comment ?? null } : {}),
          executed_at: input.status !== 'untested' ? now : null,
          // 사용자가 수동으로 수정하면 자동(auto) 출처를 manual 로 되돌려 출처가 stale 해지지 않게 한다.
          result_source: 'manual',
          updated_at: now,
        })
        .where(
          and(
            inArray(testCaseRuns.id, input.testCaseRunIds),
            inArray(
              testCaseRuns.test_run_id,
              tx
                .select({ id: testRuns.id })
                .from(testRuns)
                .where(
                  and(
                    eq(testRuns.project_id, run.projectId),
                    eq(testRuns.lifecycle_status, 'ACTIVE')
                  )
                )
            )
          )
        )
        .returning({ id: testCaseRuns.id, testRunId: testCaseRuns.test_run_id });

      // 선택한 결과가 여러 실행에 걸쳐 있어도 바뀐 실행마다 상태를 다시 계산한다.
      const runIds = [...new Set(rows.map((row) => row.testRunId).filter((id) => id !== null))];
      if (runIds.length > 0) await recomputeTestRunStatus(tx, runIds);
      return rows;
    });

    invalidateCache(INVALIDATE.runs);
    return {
      success: true,
      data: { updatedCount: updated.length },
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'bulkUpdateTestCaseRunStatus' } });
    return {
      success: false,
      errors: { _general: ['일괄 상태 업데이트 중 오류가 발생했습니다.'] },
    };
  }
}
