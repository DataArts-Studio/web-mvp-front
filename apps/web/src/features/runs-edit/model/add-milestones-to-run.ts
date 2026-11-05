'use server';

import { requireProjectAccess } from '@/access/lib/require-access';
import { assertRunResources } from '@/entities/test-run/api/assert-run-resources';
import { addCasesToRunScope, recomputeTestRunStatus } from '@/entities/test-run/api/run-scope';
import { INVALIDATE, invalidateCache } from '@/shared/lib/cache/tags';
import * as Sentry from '@sentry/nextjs';
import { getDatabase, milestoneTestCases, testCases, testRuns } from '@testea/db';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

type SetMilestoneForRunResult =
  | { success: true; addedCount: number }
  | { success: false; error: string };

export async function addMilestonesToRunAction(
  runId: string,
  milestoneIds: string[]
): Promise<SetMilestoneForRunResult> {
  const parsed = z
    .object({
      runId: z.string().uuid(),
      ids: z.array(z.string().uuid()).min(1),
    })
    .safeParse({ runId, ids: milestoneIds });
  if (!parsed.success) {
    return { success: false, error: '유효한 실행 및 연결 대상을 선택해주세요.' };
  }
  milestoneIds = [...new Set(parsed.data.ids)];
  const milestoneId = milestoneIds[0];

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

  try {
    const result = await db.transaction(async (tx) => {
      await assertRunResources(tx, run.projectId!, { milestoneIds });

      // 마일스톤에 직접 연결된 케이스. 휴지통 케이스는 실행에 넣지 않는다 (#377).
      const milestoneCaseRows = await tx
        .select({ test_case_id: milestoneTestCases.test_case_id })
        .from(milestoneTestCases)
        .innerJoin(testCases, eq(testCases.id, milestoneTestCases.test_case_id))
        .where(
          and(
            eq(milestoneTestCases.milestone_id, milestoneId),
            eq(testCases.lifecycle_status, 'ACTIVE')
          )
        );

      await assertRunResources(tx, run.projectId!, {
        caseIds: milestoneCaseRows.map((row) => row.test_case_id!),
      });

      await tx
        .update(testRuns)
        .set({ milestone_id: milestoneId, updated_at: new Date() })
        .where(eq(testRuns.id, runId));

      const addedCount = await addCasesToRunScope(
        tx,
        runId,
        milestoneCaseRows
          .filter((row) => row.test_case_id)
          .map((row) => ({
            caseId: row.test_case_id!,
            sourceType: 'milestone' as const,
            sourceId: milestoneId,
          }))
      );

      await recomputeTestRunStatus(tx, runId);
      return addedCount;
    });

    invalidateCache(INVALIDATE.runs);
    return { success: true, addedCount: result };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'addMilestonesToRunAction' } });
    return { success: false, error: '마일스톤 추가에 실패했습니다. 잠시 후 다시 시도해주세요.' };
  }
}
