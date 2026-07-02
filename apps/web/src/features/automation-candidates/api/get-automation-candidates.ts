'use server';

import type { ActionResult } from '@/shared/types';
import * as Sentry from '@sentry/nextjs';
import { getDatabase, testCaseRuns, testCases } from '@testea/db';
import { and, eq, isNull, ne, sql } from 'drizzle-orm';

import { MIN_DISTINCT_RUNS } from '../lib/constants';
import { buildCandidateDecision, computeScore, evaluateReasons } from '../lib/score';
import type { AutomationCandidatesResult, AutomationCandidatesStats, CandidateRow } from '../types';

/**
 * FDD-TR13 자동화 후보 식별 엔진 (읽기 전용).
 *
 * 프로젝트의 ACTIVE 케이스를 케이스 기준(test_case_id)으로 실행 이력을 집계해
 * 자동화 후보와 플래키 그룹을 분류한다.
 *
 * 중요(TR12 회귀 교훈): 실행 집계를 `source_type`/`source_id` 로 좁히지 않는다.
 * 마일스톤 경유로 실행된 스위트 케이스가 누락돼 "실행 이력 없음"으로 빠지는 버그가
 * 났었다. 여기서는 source_type 을 완전히 무시하고 test_case_id 의 모든 실행을 본다.
 *
 * 집계 규칙:
 * - excluded_at IS NOT NULL 실행은 전부 제외.
 * - status='untested' 는 빈도/안정성 집계에서 제외 (아직 안 돈 결과).
 * - automation_status='automated' 케이스는 추천 대상에서 제외.
 *
 * query 이므로 requireProjectAccess 가드 없음(읽기 공개). mutation 만 가드한다.
 */
export async function getAutomationCandidates(
  projectId: string
): Promise<ActionResult<AutomationCandidatesResult>> {
  try {
    const db = getDatabase();

    // 1. 프로젝트 ACTIVE 케이스 (automated 포함 — stats 계산에 필요).
    const cases = await db
      .select({
        id: testCases.id,
        name: testCases.name,
        caseKey: testCases.case_key,
        displayId: testCases.display_id,
        suiteId: testCases.test_suite_id,
        testType: testCases.test_type,
        tags: testCases.tags,
        automationStatus: testCases.automation_status,
      })
      .from(testCases)
      .where(and(eq(testCases.project_id, projectId), eq(testCases.lifecycle_status, 'ACTIVE')));

    if (cases.length === 0) {
      return { success: true, data: emptyResult(0) };
    }

    // 2. 실행 결과를 케이스 기준으로 DB 에서 집계한다.
    //    - source_type 으로 좁히지 않음 (TR12 회귀 방지).
    //    - excluded_at 실행 제외.
    //    - untested 는 결과 집계에서 제외 (status <> 'untested').
    //    프로젝트 케이스만 집계하도록 inner join 으로 묶는다.
    const aggRows = await db
      .select({
        caseId: testCaseRuns.test_case_id,
        distinctRuns: sql<number>`count(distinct ${testCaseRuns.test_run_id})`.mapWith(Number),
        evaluatedResults: sql<number>`count(*)`.mapWith(Number),
        passCount: sql<number>`count(*) filter (where ${testCaseRuns.status} = 'pass')`.mapWith(
          Number
        ),
        failCount: sql<number>`count(*) filter (where ${testCaseRuns.status} = 'fail')`.mapWith(
          Number
        ),
        blockedCount:
          sql<number>`count(*) filter (where ${testCaseRuns.status} = 'blocked')`.mapWith(Number),
        lastExecutedAt: sql<string | null>`max(${testCaseRuns.executed_at})`,
      })
      .from(testCaseRuns)
      .innerJoin(testCases, eq(testCases.id, testCaseRuns.test_case_id))
      .where(
        and(
          eq(testCases.project_id, projectId),
          isNull(testCaseRuns.excluded_at),
          ne(testCaseRuns.status, 'untested')
        )
      )
      .groupBy(testCaseRuns.test_case_id);

    const aggByCase = new Map(aggRows.map((r) => [r.caseId, r] as const));
    const now = Date.now();

    const candidates: CandidateRow[] = [];
    const flaky: CandidateRow[] = [];

    let totalCasesWithRuns = 0;
    let ge3Runs = 0;
    let alreadyAutomated = 0;

    for (const c of cases) {
      if (c.automationStatus === 'automated') {
        alreadyAutomated += 1;
        continue; // 추천 대상에서 제외.
      }

      const agg = c.id ? aggByCase.get(c.id) : undefined;
      const distinctRuns = agg?.distinctRuns ?? 0;
      const evaluatedResults = agg?.evaluatedResults ?? 0;
      const passCount = agg?.passCount ?? 0;
      const failCount = agg?.failCount ?? 0;
      const blockedCount = agg?.blockedCount ?? 0;

      if (evaluatedResults > 0) totalCasesWithRuns += 1;
      if (distinctRuns >= MIN_DISTINCT_RUNS) ge3Runs += 1;

      // 실행 이력이 전혀 없으면 후보/플래키 어느 쪽도 아님.
      if (evaluatedResults === 0) continue;

      const passRate = passCount / evaluatedResults;
      const lastExecutedAtMs = agg?.lastExecutedAt ? new Date(agg.lastExecutedAt).getTime() : null;
      const daysSinceLastRun =
        lastExecutedAtMs === null
          ? null
          : Math.floor((now - lastExecutedAtMs) / (1000 * 60 * 60 * 24));

      const scoreInput = {
        distinctRuns,
        evaluatedResults,
        passCount,
        failCount,
        blockedCount,
        passRate,
        daysSinceLastRun,
      };
      const reasons = evaluateReasons(scoreInput);
      const score = computeScore(scoreInput);

      const row: CandidateRow = {
        caseId: c.id,
        caseKey: c.caseKey,
        displayId: c.displayId,
        name: c.name,
        suiteId: c.suiteId,
        testType: c.testType,
        tags: c.tags,
        automationStatus: c.automationStatus,
        distinctRuns,
        evaluatedResults,
        passCount,
        failCount,
        blockedCount,
        passRate: Math.round(passRate * 1000) / 1000,
        lastExecutedAt: agg?.lastExecutedAt ? new Date(agg.lastExecutedAt).toISOString() : null,
        daysSinceLastRun,
        score,
        decision: buildCandidateDecision(scoreInput, reasons, score),
        reasons,
      };

      // 플래키 게이트: 점수가 높아도 플래키면 후보에서 빼고 별도 그룹으로.
      if (reasons.flaky) {
        flaky.push(row);
        continue;
      }

      // 후보 자격: 빈도·표본 수·안정성·최근성·blocked 비율을 모두 충족해야 추천.
      if (
        reasons.frequent &&
        reasons.enoughHistory &&
        reasons.stable &&
        reasons.lowBlocked &&
        reasons.recent
      ) {
        candidates.push(row);
      }
    }

    candidates.sort((a, b) => b.score - a.score);
    flaky.sort((a, b) => b.score - a.score);

    const stats: AutomationCandidatesStats = {
      totalCases: cases.length,
      totalCasesWithRuns,
      ge3Runs,
      alreadyAutomated,
      flakyCount: flaky.length,
      candidateCount: candidates.length,
    };

    return { success: true, data: { candidates, flaky, stats } };
  } catch (error) {
    Sentry.captureException(error, {
      extra: { action: 'getAutomationCandidates', projectId },
    });
    return {
      success: false,
      errors: { _general: ['자동화 후보를 불러오는 중 오류가 발생했습니다.'] },
    };
  }
}

function emptyResult(totalCases: number): AutomationCandidatesResult {
  return {
    candidates: [],
    flaky: [],
    stats: {
      totalCases,
      totalCasesWithRuns: 0,
      ge3Runs: 0,
      alreadyAutomated: 0,
      flakyCount: 0,
      candidateCount: 0,
    },
  };
}
