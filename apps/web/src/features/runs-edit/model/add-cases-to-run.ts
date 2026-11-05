'use server';

import { requireProjectAccess } from '@/access/lib/require-access';
import { addCasesToRunScope, recomputeTestRunStatus } from '@/entities/test-run/api/run-scope';
import { INVALIDATE, invalidateCache } from '@/shared/lib/cache/tags';
import * as Sentry from '@sentry/nextjs';
import { getDatabase, testCases, testRuns } from '@testea/db';
import { and, eq, inArray } from 'drizzle-orm';

type AddCasesToRunResult =
  | { success: true; addedCount: number }
  | { success: false; error: string };

export async function addCasesToRunAction(
  runId: string,
  caseIds: string[]
): Promise<AddCasesToRunResult> {
  if (caseIds.length === 0) {
    return { success: false, error: '추가할 케이스를 선택해주세요.' };
  }

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
      // IDOR 방지: run 의 프로젝트에 속한 케이스만 추가 (타 프로젝트 caseId 차단).
      // 휴지통 케이스는 실행에 넣지 않는다 (#377).
      const ownedRows = await tx
        .select({ id: testCases.id })
        .from(testCases)
        .where(
          and(
            eq(testCases.project_id, run.projectId!),
            inArray(testCases.id, caseIds),
            eq(testCases.lifecycle_status, 'ACTIVE')
          )
        );

      const addedCount = await addCasesToRunScope(
        tx,
        runId,
        ownedRows.map((row) => ({ caseId: row.id, sourceType: 'adhoc' as const, sourceId: null }))
      );

      await recomputeTestRunStatus(tx, runId);
      return addedCount;
    });

    invalidateCache(INVALIDATE.runs);
    return { success: true, addedCount: result };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'addCasesToRunAction' } });
    return { success: false, error: '케이스 추가에 실패했습니다. 잠시 후 다시 시도해주세요.' };
  }
}
