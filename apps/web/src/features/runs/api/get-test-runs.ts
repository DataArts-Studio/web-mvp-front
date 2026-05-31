'use server';

import type { FetchedTestRun } from '@/entities/test-run';
import { ActionResult } from '@/shared/types';
import * as Sentry from '@sentry/nextjs';
import {
  getDatabase,
  milestones,
  testCaseRuns,
  testRunSuites,
  testRuns,
  testSuites,
} from '@testea/db';
import { and, eq, inArray, isNull } from 'drizzle-orm';

export async function getTestRunsByProjectId(
  projectId: string
): Promise<ActionResult<FetchedTestRun[]>> {
  try {
    const db = getDatabase();

    // 1. 테스트 실행 목록 (ACTIVE만)
    const runs = await db
      .select()
      .from(testRuns)
      .where(and(eq(testRuns.project_id, projectId), eq(testRuns.lifecycle_status, 'ACTIVE')));

    if (runs.length === 0) {
      return { success: true, data: [] };
    }

    const runIds = runs.map((r) => r.id);
    const milestoneIds = [...new Set(runs.map((r) => r.milestone_id).filter(Boolean))] as string[];

    // 독립 쿼리 3개를 병렬 실행 (직렬 5쿼리 → runs 이후 2 라운드트립).
    // 스위트 이름은 별도 조회 대신 JOIN으로 합쳐 라운드트립 1회 추가 제거.
    const [runSuiteRows, milestoneRows, allCaseRuns] = await Promise.all([
      // 실행-스위트 연결 + 스위트 이름 (논리 삭제 제외)
      db
        .select({
          test_run_id: testRunSuites.test_run_id,
          test_suite_id: testRunSuites.test_suite_id,
          suiteName: testSuites.name,
        })
        .from(testRunSuites)
        .innerJoin(testSuites, eq(testSuites.id, testRunSuites.test_suite_id))
        .where(and(inArray(testRunSuites.test_run_id, runIds), isNull(testRunSuites.excluded_at))),

      // 마일스톤 이름 (ACTIVE만)
      milestoneIds.length > 0
        ? db
            .select({ id: milestones.id, name: milestones.name })
            .from(milestones)
            .where(
              and(inArray(milestones.id, milestoneIds), eq(milestones.lifecycle_status, 'ACTIVE'))
            )
        : Promise.resolve([] as { id: string; name: string }[]),

      // 테스트 케이스 실행 결과 (논리 삭제 제외)
      db
        .select()
        .from(testCaseRuns)
        .where(and(inArray(testCaseRuns.test_run_id, runIds), isNull(testCaseRuns.excluded_at))),
    ]);

    const suiteMap = new Map(runSuiteRows.map((rs) => [rs.test_suite_id, rs.suiteName] as const));
    const milestoneMap = new Map(milestoneRows.map((m) => [m.id, m.name]));

    // 실행별 케이스 실행 그룹핑
    const caseRunsByRunId = new Map<string, typeof allCaseRuns>();
    for (const cr of allCaseRuns) {
      if (!cr.test_run_id) continue;
      const list = caseRunsByRunId.get(cr.test_run_id) || [];
      list.push(cr);
      caseRunsByRunId.set(cr.test_run_id, list);
    }

    // 실행별 스위트 그룹핑
    const suitesByRunId = new Map<string, string[]>();
    for (const rs of runSuiteRows) {
      if (!rs.test_run_id || !rs.test_suite_id) continue;
      const list = suitesByRunId.get(rs.test_run_id) || [];
      list.push(rs.test_suite_id);
      suitesByRunId.set(rs.test_run_id, list);
    }

    // 결과 조합
    const formattedRuns: FetchedTestRun[] = runs
      .sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime())
      .map((run) => {
        let sourceType: FetchedTestRun['sourceType'] = 'ADHOC';
        let sourceName = '직접 선택한 케이스';

        const runSuites = suitesByRunId.get(run.id) || [];
        if (runSuites.length > 0) {
          sourceType = 'SUITE';
          sourceName = runSuites
            .map((sid) => suiteMap.get(sid) || '')
            .filter(Boolean)
            .join(', ');
        } else if (run.milestone_id) {
          sourceType = 'MILESTONE';
          sourceName = milestoneMap.get(run.milestone_id) || '';
        }

        const caseRuns = caseRunsByRunId.get(run.id) || [];
        const totalCases = caseRuns.length;
        const pass = caseRuns.filter((cr) => cr.status === 'pass').length;
        const fail = caseRuns.filter((cr) => cr.status === 'fail').length;
        const blocked = caseRuns.filter((cr) => cr.status === 'blocked').length;
        const untested = caseRuns.filter((cr) => cr.status === 'untested').length;
        const completedCases = pass + fail + blocked;
        const progressPercent =
          totalCases > 0 ? Math.round((completedCases / totalCases) * 100) : 0;

        return {
          id: run.id,
          name: run.name,
          description: run.description,
          status: run.status,
          sourceType,
          sourceName,
          updatedAt: run.updated_at,
          stats: { totalCases, completedCases, progressPercent, pass, fail, blocked, untested },
        };
      });

    return { success: true, data: formattedRuns };
  } catch (error) {
    console.error('[getTestRunsByProjectId] Error:', error);
    Sentry.captureException(error, { extra: { action: 'getTestRunsByProjectId', projectId } });
    return {
      success: false,
      errors: { _general: ['테스트 실행 목록을 불러오는 중 오류가 발생했습니다.'] },
    };
  }
}
