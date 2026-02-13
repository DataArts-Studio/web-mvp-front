'use server';

import * as Sentry from '@sentry/nextjs';
import {
  getDatabase,
  testCaseRuns,
  milestoneTestCases,
  testRuns,
} from '@/shared/lib/db';
import { eq, and, inArray } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import { requireProjectAccess } from '@/access/lib/require-access';

type SetMilestoneForRunResult =
  | { success: true; addedCount: number }
  | { success: false; error: string };

export async function addMilestonesToRunAction(
  runId: string,
  milestoneIds: string[]
): Promise<SetMilestoneForRunResult> {
  const milestoneId = milestoneIds[0];
  if (!milestoneId) {
    return { success: false, error: '추가할 마일스톤을 선택해주세요.' };
  }

  const db = getDatabase();

  // 접근 권한 확인
  const [run] = await db.select({ projectId: testRuns.project_id }).from(testRuns).where(eq(testRuns.id, runId)).limit(1);
  if (!run?.projectId || !(await requireProjectAccess(run.projectId))) {
    return { success: false, error: '접근 권한이 없습니다.' };
  }

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Update milestone_id directly on the test run
      await tx
        .update(testRuns)
        .set({ milestone_id: milestoneId, updated_at: new Date() })
        .where(eq(testRuns.id, runId));

      // 2. Get test cases belonging to the milestone (with milestone_id for source tracking)
      const milestoneCaseRows = await tx
        .select({
          test_case_id: milestoneTestCases.test_case_id,
          milestone_id: milestoneTestCases.milestone_id,
        })
        .from(milestoneTestCases)
        .where(eq(milestoneTestCases.milestone_id, milestoneId));

      const caseIdToMilestone = new Map<string, string>();
      for (const row of milestoneCaseRows) {
        if (row.test_case_id && row.milestone_id) {
          caseIdToMilestone.set(row.test_case_id, row.milestone_id);
        }
      }

      const caseIds = Array.from(caseIdToMilestone.keys());
      if (caseIds.length === 0) return 0;

      // 3. Find existing test case runs to avoid duplicates
      const existingRows = await tx
        .select({ test_case_id: testCaseRuns.test_case_id })
        .from(testCaseRuns)
        .where(
          and(
            eq(testCaseRuns.test_run_id, runId),
            inArray(testCaseRuns.test_case_id, caseIds)
          )
        );

      const existingCaseIds = new Set(existingRows.map((r) => r.test_case_id));
      const newCaseIds = caseIds.filter((id) => !existingCaseIds.has(id));

      if (newCaseIds.length === 0) return 0;

      // 4. Create test case run records for new cases with source tracking
      const newTestCaseRuns = newCaseIds.map((caseId) => ({
        id: uuidv7(),
        test_run_id: runId,
        test_case_id: caseId,
        status: 'untested' as const,
        source_type: 'milestone' as const,
        source_id: caseIdToMilestone.get(caseId),
        created_at: new Date(),
        updated_at: new Date(),
      }));

      await tx.insert(testCaseRuns).values(newTestCaseRuns);
      return newCaseIds.length;
    });

    return { success: true, addedCount: result };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'addMilestonesToRunAction' } });
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: `마일스톤 추가에 실패했습니다: ${message}` };
  }
}
