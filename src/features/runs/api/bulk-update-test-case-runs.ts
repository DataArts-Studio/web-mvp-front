'use server';

import * as Sentry from '@sentry/nextjs';
import { getDatabase, testCaseRuns, testRuns, type TestCaseRunStatus, type TestRunStatus } from '@/shared/lib/db';
import { ActionResult } from '@/shared/types';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { requireProjectAccess } from '@/access/lib/require-access';

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
      .select({ projectId: testRuns.project_id })
      .from(testRuns)
      .where(eq(testRuns.id, firstCaseRun.testRunId))
      .limit(1);

    if (!run?.projectId || !(await requireProjectAccess(run.projectId))) {
      return { success: false, errors: { _general: ['접근 권한이 없습니다.'] } };
    }

    const now = new Date();

    // 일괄 업데이트
    const updated = await db
      .update(testCaseRuns)
      .set({
        status: input.status,
        ...(input.comment !== undefined ? { comment: input.comment ?? null } : {}),
        executed_at: input.status !== 'untested' ? now : null,
        updated_at: now,
      })
      .where(inArray(testCaseRuns.id, input.testCaseRunIds))
      .returning({ id: testCaseRuns.id });

    // 테스트 실행 상태 갱신
    await updateTestRunStatus(db, firstCaseRun.testRunId);

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

async function updateTestRunStatus(db: ReturnType<typeof getDatabase>, testRunId: string) {
  const caseRuns = await db
    .select({ status: testCaseRuns.status })
    .from(testCaseRuns)
    .where(and(eq(testCaseRuns.test_run_id, testRunId), isNull(testCaseRuns.excluded_at)));

  if (caseRuns.length === 0) return;

  const untested = caseRuns.filter(c => c.status === 'untested').length;
  const total = caseRuns.length;

  let newStatus: TestRunStatus;
  if (untested === total) {
    newStatus = 'NOT_STARTED';
  } else if (untested === 0) {
    newStatus = 'COMPLETED';
  } else {
    newStatus = 'IN_PROGRESS';
  }

  await db
    .update(testRuns)
    .set({ status: newStatus, updated_at: new Date() })
    .where(eq(testRuns.id, testRunId));
}
