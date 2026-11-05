'use server';

import { ACCESS_DENIED, canAccess } from '@/access/lib/project-scope';
import type { RunComparison } from '@/entities/test-run';
import { ActionResult } from '@/shared/types';
import * as Sentry from '@sentry/nextjs';
import { getDatabase, testCaseRuns, testRunSuites, testRuns } from '@testea/db';
import { and, desc, eq, inArray, isNull, lt, ne, sql } from 'drizzle-orm';

/** 케이스별로 남기는 최근 결과 수 */
const HISTORY_SIZE = 5;

/**
 * 끝난 실행 화면(리뉴얼 v2 06f2)의 비교 데이터.
 *
 * - 직전 실행: 같은 마일스톤으로 만든 실행, 마일스톤이 없으면 같은 스위트 묶음으로 만든 실행 중
 *   이 실행보다 먼저 만든 가장 최근 것. 직접 고른 케이스로 만든 실행은 비교하지 않는다.
 * - 케이스별 최근 결과: 이 프로젝트의 활성 실행에서 기록된 결과(미실행 제외) 최근 5개.
 */
export async function getRunComparison(testRunId: string): Promise<ActionResult<RunComparison>> {
  try {
    if (!(await canAccess('testRun', testRunId))) return ACCESS_DENIED;

    const db = getDatabase();
    const [run] = await db
      .select({
        id: testRuns.id,
        projectId: testRuns.project_id,
        milestoneId: testRuns.milestone_id,
        createdAt: testRuns.created_at,
      })
      .from(testRuns)
      .where(eq(testRuns.id, testRunId))
      .limit(1);
    if (!run?.projectId) {
      return { success: false, errors: { _general: ['테스트 실행을 찾을 수 없습니다.'] } };
    }

    const caseRows = await db
      .select({ testCaseId: testCaseRuns.test_case_id })
      .from(testCaseRuns)
      .where(and(eq(testCaseRuns.test_run_id, run.id), isNull(testCaseRuns.excluded_at)));
    const caseIds = [...new Set(caseRows.map((r) => r.testCaseId).filter(Boolean))] as string[];

    // 1. 직전 실행 찾기
    const earlierRuns = await db
      .select({
        id: testRuns.id,
        name: testRuns.name,
        milestoneId: testRuns.milestone_id,
        createdAt: testRuns.created_at,
      })
      .from(testRuns)
      .where(
        and(
          eq(testRuns.project_id, run.projectId),
          eq(testRuns.lifecycle_status, 'ACTIVE'),
          ne(testRuns.id, run.id),
          lt(testRuns.created_at, run.createdAt)
        )
      )
      .orderBy(desc(testRuns.created_at));

    let previous: (typeof earlierRuns)[number] | null = null;
    if (run.milestoneId) {
      previous = earlierRuns.find((r) => r.milestoneId === run.milestoneId) ?? null;
    } else {
      const suiteRows = await db
        .select({ runId: testRunSuites.test_run_id, suiteId: testRunSuites.test_suite_id })
        .from(testRunSuites)
        .where(
          and(
            inArray(testRunSuites.test_run_id, [run.id, ...earlierRuns.map((r) => r.id)]),
            isNull(testRunSuites.excluded_at)
          )
        );
      const keyOf = (runId: string) =>
        suiteRows
          .filter((r) => r.runId === runId && r.suiteId)
          .map((r) => r.suiteId as string)
          .sort()
          .join(',');
      const key = keyOf(run.id);
      if (key) {
        previous = earlierRuns.find((r) => !r.milestoneId && keyOf(r.id) === key) ?? null;
      }
    }

    // 2. 직전 실행의 케이스별 결과
    const previousRows = previous
      ? await db
          .select({
            testCaseId: testCaseRuns.test_case_id,
            status: testCaseRuns.status,
            comment: testCaseRuns.comment,
            executedAt: testCaseRuns.executed_at,
          })
          .from(testCaseRuns)
          .where(and(eq(testCaseRuns.test_run_id, previous.id), isNull(testCaseRuns.excluded_at)))
      : [];
    const previousByCase: RunComparison['previousByCase'] = {};
    for (const row of previousRows) {
      if (!row.testCaseId) continue;
      previousByCase[row.testCaseId] = {
        status: row.status,
        comment: row.comment,
        executedAt: row.executedAt,
      };
    }

    // 3. 케이스별 최근 결과
    const historyRows =
      caseIds.length > 0
        ? await db
            .select({
              testCaseId: testCaseRuns.test_case_id,
              status: testCaseRuns.status,
              executedAt: testCaseRuns.executed_at,
              runId: testCaseRuns.test_run_id,
            })
            .from(testCaseRuns)
            .innerJoin(testRuns, eq(testRuns.id, testCaseRuns.test_run_id))
            .where(
              and(
                inArray(testCaseRuns.test_case_id, caseIds),
                eq(testRuns.project_id, run.projectId),
                eq(testRuns.lifecycle_status, 'ACTIVE'),
                isNull(testCaseRuns.excluded_at),
                ne(testCaseRuns.status, 'untested'),
                // 최근 결과는 이 실행의 마지막 기록까지만 본다. 나중 실행의 결과가 섞이지 않게 하고,
                // DB 의 마이크로초 정밀도를 잃지 않도록 비교는 DB 안에서 한다.
                sql`${testCaseRuns.executed_at} <= (select max(cr.executed_at) from test_case_runs cr where cr.test_run_id = ${run.id})`
              )
            )
            .orderBy(desc(testCaseRuns.executed_at))
        : [];
    const historyByCase: RunComparison['historyByCase'] = {};
    for (const row of historyRows) {
      if (!row.testCaseId || !row.executedAt || !row.runId) continue;
      const list = (historyByCase[row.testCaseId] ??= []);
      if (list.length < HISTORY_SIZE) {
        list.push({ status: row.status, executedAt: row.executedAt, runId: row.runId });
      }
    }
    // 화면은 오래된 것부터 보여 준다.
    for (const list of Object.values(historyByCase)) list.reverse();

    const previousTotal = previousRows.length;
    const previousPass = previousRows.filter((r) => r.status === 'pass').length;

    return {
      success: true,
      data: {
        previous: previous
          ? {
              id: previous.id,
              name: previous.name,
              createdAt: previous.createdAt,
              passRate: previousTotal > 0 ? Math.round((previousPass / previousTotal) * 100) : null,
            }
          : null,
        previousByCase,
        historyByCase,
      },
    };
  } catch (error) {
    console.error('[getRunComparison] Error:', error);
    Sentry.captureException(error, { extra: { action: 'getRunComparison', testRunId } });
    return {
      success: false,
      errors: { _general: ['직전 실행과 비교하는 중 오류가 발생했습니다.'] },
    };
  }
}
