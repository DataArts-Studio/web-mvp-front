'use server';

import { requireProjectAccess } from '@/access/lib/require-access';
import type { UpdateTestCaseRunInput, UpdateTestCaseRunResult } from '@/entities/test-run';
import { recomputeTestRunStatus } from '@/entities/test-run/api/run-scope';
import { RUN_NOT_ACTIVE_MESSAGE } from '@/entities/test-run/model/schema';
import { INVALIDATE, invalidateCache } from '@/shared/lib/cache/tags';
import { ActionResult } from '@/shared/types';
import * as Sentry from '@sentry/nextjs';
import { getDatabase, testCaseRuns, testRuns } from '@testea/db';
import { and, eq, inArray } from 'drizzle-orm';

export async function updateTestCaseRunStatus(
  input: UpdateTestCaseRunInput
): Promise<ActionResult<UpdateTestCaseRunResult>> {
  try {
    const db = getDatabase();

    // 접근 권한 확인: testCaseRun -> testRun -> project_id
    const [caseRun] = await db
      .select({ testRunId: testCaseRuns.test_run_id })
      .from(testCaseRuns)
      .where(eq(testCaseRuns.id, input.testCaseRunId))
      .limit(1);
    if (caseRun?.testRunId) {
      const [run] = await db
        .select({ projectId: testRuns.project_id, lifecycleStatus: testRuns.lifecycle_status })
        .from(testRuns)
        .where(eq(testRuns.id, caseRun.testRunId))
        .limit(1);
      if (!run?.projectId || !(await requireProjectAccess(run.projectId))) {
        return { success: false, errors: { _general: ['접근 권한이 없습니다.'] } };
      }
      if (run.lifecycleStatus !== 'ACTIVE') {
        return { success: false, errors: { _general: [RUN_NOT_ACTIVE_MESSAGE] } };
      }
    }

    const now = new Date();

    const [updated] = await db
      .update(testCaseRuns)
      .set({
        status: input.status,
        // 코멘트를 보내지 않은 변경(목록의 상태 드롭다운)은 저장된 코멘트를 그대로 둔다 (#413).
        ...(input.comment !== undefined ? { comment: input.comment } : {}),
        executed_at: input.status !== 'untested' ? now : null,
        // 사용자가 수동으로 수정하면 자동(auto) 출처를 manual 로 되돌려 출처가 stale 해지지 않게 한다.
        result_source: 'manual',
        updated_at: now,
      })
      .where(
        and(
          eq(testCaseRuns.id, input.testCaseRunId),
          // 확인과 저장 사이에 실행이 삭제돼도 바꾸지 않는다 (#419).
          inArray(
            testCaseRuns.test_run_id,
            db
              .select({ id: testRuns.id })
              .from(testRuns)
              .where(eq(testRuns.lifecycle_status, 'ACTIVE'))
          )
        )
      )
      .returning();

    if (!updated) {
      return {
        success: false,
        errors: { _general: ['테스트 케이스 실행을 찾을 수 없습니다.'] },
      };
    }

    // Update test run status based on case results
    if (updated.test_run_id) {
      await recomputeTestRunStatus(db, updated.test_run_id);
    }

    invalidateCache(INVALIDATE.runs);
    return {
      success: true,
      data: {
        id: updated.id,
        status: updated.status,
        comment: updated.comment,
        executedAt: updated.executed_at,
      },
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'updateTestCaseRunStatus' } });
    return {
      success: false,
      errors: { _general: ['상태 업데이트 중 오류가 발생했습니다.'] },
    };
  }
}
