'use server';

import { allBelongToProject, parseIdList } from '@/access/lib/project-scope';
import { requireProjectAccess } from '@/access/lib/require-access';
import { INVALIDATE, invalidateCache } from '@/shared/lib/cache/tags';
import * as Sentry from '@sentry/nextjs';
import { getDatabase, milestoneTestCases, testCaseRuns, testCases, testRuns } from '@testea/db';
import { and, eq, inArray } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';

type SetMilestoneForRunResult =
  | { success: true; addedCount: number }
  | { success: false; error: string };

export async function addMilestonesToRunAction(
  runId: string,
  milestoneIds: string[]
): Promise<SetMilestoneForRunResult> {
  if (!Array.isArray(milestoneIds) || milestoneIds.length === 0) {
    return { success: false, error: '추가할 마일스톤을 선택해주세요.' };
  }
  const parsed = parseIdList(milestoneIds);
  if (!parsed) {
    return { success: false, error: '잘못된 요청입니다.' };
  }
  // 실행에는 마일스톤 하나만 연결된다(교체). 선택 UI 가 다중 선택이라 첫 번째를 쓴다.
  const milestoneId = parsed[0];

  const db = getDatabase();

  // 접근 권한 확인
  const [run] = await db
    .select({ projectId: testRuns.project_id })
    .from(testRuns)
    .where(eq(testRuns.id, runId))
    .limit(1);
  if (!run?.projectId || !(await requireProjectAccess(run.projectId))) {
    return { success: false, error: '접근 권한이 없습니다.' };
  }
  // 보낸 ID 전부가 같은 프로젝트 소속이어야 한다(쓰지 않는 ID 도 섞여 있으면 거부).
  if (!(await allBelongToProject('milestone', parsed, run.projectId))) {
    return { success: false, error: '접근 권한이 없습니다.' };
  }
  const projectId = run.projectId;

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
        .innerJoin(testCases, eq(testCases.id, milestoneTestCases.test_case_id))
        .where(
          and(eq(milestoneTestCases.milestone_id, milestoneId), eq(testCases.project_id, projectId))
        );

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
          and(eq(testCaseRuns.test_run_id, runId), inArray(testCaseRuns.test_case_id, caseIds))
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

    invalidateCache(INVALIDATE.runs);
    return { success: true, addedCount: result };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'addMilestonesToRunAction' } });
    return { success: false, error: '마일스톤 추가에 실패했습니다. 잠시 후 다시 시도해주세요.' };
  }
}
