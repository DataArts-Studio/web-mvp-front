'use server';

import { requireProjectAccess } from '@/access/lib/require-access';
import { assertRunResources } from '@/entities/test-run/api/assert-run-resources';
import { addCasesToRunScope, recomputeTestRunStatus } from '@/entities/test-run/api/run-scope';
import { INVALIDATE, invalidateCache } from '@/shared/lib/cache/tags';
import * as Sentry from '@sentry/nextjs';
import { getDatabase, testCases, testRunSuites, testRuns } from '@testea/db';
import { and, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';

type AddSuitesToRunResult =
  | { success: true; addedCount: number }
  | { success: false; error: string };

export async function addSuitesToRunAction(
  runId: string,
  suiteIds: string[]
): Promise<AddSuitesToRunResult> {
  const parsed = z
    .object({
      runId: z.string().uuid(),
      ids: z.array(z.string().uuid()).min(1),
    })
    .safeParse({ runId, ids: suiteIds });
  if (!parsed.success) {
    return { success: false, error: '유효한 실행 및 연결 대상을 선택해주세요.' };
  }
  suiteIds = [...new Set(parsed.data.ids)];

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
      await assertRunResources(tx, run.projectId!, { suiteIds });

      const suiteCaseRows = await tx
        .select({
          id: testCases.id,
          test_suite_id: testCases.test_suite_id,
        })
        .from(testCases)
        .where(
          and(inArray(testCases.test_suite_id, suiteIds), eq(testCases.lifecycle_status, 'ACTIVE'))
        );

      await assertRunResources(tx, run.projectId!, {
        caseIds: suiteCaseRows.map((row) => row.id!),
      });

      // 스위트 연결. 예전에 제거한 스위트면 제외 표시를 지워 다시 연결한다 (#375).
      await tx
        .insert(testRunSuites)
        .values(suiteIds.map((suiteId) => ({ test_run_id: runId, test_suite_id: suiteId })))
        .onConflictDoUpdate({
          target: [testRunSuites.test_run_id, testRunSuites.test_suite_id],
          set: { excluded_at: null },
        });

      const addedCount = await addCasesToRunScope(
        tx,
        runId,
        suiteCaseRows
          .filter((row) => row.id && row.test_suite_id)
          .map((row) => ({
            caseId: row.id,
            sourceType: 'suite' as const,
            sourceId: row.test_suite_id,
          }))
      );

      await recomputeTestRunStatus(tx, runId);
      return addedCount;
    });

    invalidateCache(INVALIDATE.runs);
    return { success: true, addedCount: result };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'addSuitesToRunAction' } });
    return { success: false, error: '스위트 추가에 실패했습니다. 잠시 후 다시 시도해주세요.' };
  }
}
