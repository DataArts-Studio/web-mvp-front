'use server';

import * as Sentry from '@sentry/nextjs';
import { getDatabase, testCaseRuns, testRuns, TestCaseRunStatus, TestRunStatus } from '@/shared/lib/db';
import { ActionResult } from '@/shared/types';
import { eq, and } from 'drizzle-orm';
import { requireProjectAccess } from '@/access/lib/require-access';

export interface UpdateTestCaseRunInput {
  testCaseRunId: string;
  status: TestCaseRunStatus;
  comment?: string | null;
}

export interface UpdateTestCaseRunResult {
  id: string;
  status: TestCaseRunStatus;
  comment: string | null;
  executedAt: Date | null;
}

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
        .select({ projectId: testRuns.project_id })
        .from(testRuns)
        .where(eq(testRuns.id, caseRun.testRunId))
        .limit(1);
      if (!run?.projectId || !(await requireProjectAccess(run.projectId))) {
        return { success: false, errors: { _general: ['접근 권한이 없습니다.'] } };
      }
    }

    const now = new Date();

    const [updated] = await db
      .update(testCaseRuns)
      .set({
        status: input.status,
        comment: input.comment ?? null,
        executed_at: input.status !== 'untested' ? now : null,
        updated_at: now,
      })
      .where(eq(testCaseRuns.id, input.testCaseRunId))
      .returning();

    if (!updated) {
      return {
        success: false,
        errors: { _general: ['테스트 케이스 실행을 찾을 수 없습니다.'] },
      };
    }

    // Update test run status based on case results
    if (updated.test_run_id) {
      await updateTestRunStatus(db, updated.test_run_id);
    }

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
    console.error('Error updating test case run:', error);
    Sentry.captureException(error, { extra: { action: 'updateTestCaseRunStatus' } });
    return {
      success: false,
      errors: { _general: ['상태 업데이트 중 오류가 발생했습니다.'] },
    };
  }
}

async function updateTestRunStatus(db: ReturnType<typeof getDatabase>, testRunId: string) {
  // Get all test case runs for this test run
  const caseRuns = await db.query.testCaseRuns.findMany({
    where: eq(testCaseRuns.test_run_id, testRunId),
  });

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
    .set({
      status: newStatus,
      updated_at: new Date(),
    })
    .where(eq(testRuns.id, testRunId));
}
