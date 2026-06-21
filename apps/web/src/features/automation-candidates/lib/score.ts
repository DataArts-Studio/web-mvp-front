import type { CandidateReasons } from '../types';
import {
  FLAKY_PASS_RATE_CEILING,
  MIN_DISTINCT_RUNS,
  MIN_PASS_RATE,
  RECENCY_DAYS,
} from './constants';

export interface ScoreInput {
  distinctRuns: number;
  evaluatedResults: number;
  passCount: number;
  failCount: number;
  passRate: number;
  daysSinceLastRun: number | null;
}

/**
 * 4신호를 결합해 후보 판정 근거(reasons)를 만든다.
 *
 * 플래키: pass 와 fail 이 둘 다 있으면서 passRate 가 ceiling 미만.
 * (결과가 왔다갔다 하는 케이스는 자동화해도 안정적인 단언을 만들기 어려워 별도 분리)
 */
export function evaluateReasons(input: ScoreInput): CandidateReasons {
  const frequent = input.distinctRuns >= MIN_DISTINCT_RUNS;
  const stable = input.passRate >= MIN_PASS_RATE;
  const recent = input.daysSinceLastRun !== null && input.daysSinceLastRun <= RECENCY_DAYS;
  const flaky =
    input.passCount > 0 && input.failCount > 0 && input.passRate < FLAKY_PASS_RATE_CEILING;

  return { frequent, stable, recent, flaky };
}

/**
 * 정렬용 종합 점수. 절대 의미보다 상대 순위가 목적이다.
 *
 * - 빈도: 실행이 많을수록 자동화 ROI 가 크다 → 가장 큰 가중.
 * - 안정성: pass율이 높을수록 자동화 단언이 신뢰된다.
 * - 최근성: 최근에 돈 케이스일수록 현재 가치가 높다 → 경과일에 반비례.
 *
 * 수동 부담(단계 수)은 steps 형식이 혼재(plain text + JSON 문자열)라 신뢰도가 낮아
 * 1차 스코프에서 제외한다(FDD 위험 항목). 향후 steps 정규화 후 신호 추가 가능.
 */
export function computeScore(input: ScoreInput): number {
  const frequencyScore = input.distinctRuns * 10;
  const stabilityScore = input.passRate * 50;
  const recencyScore =
    input.daysSinceLastRun === null
      ? 0
      : Math.max(0, RECENCY_DAYS - input.daysSinceLastRun) * (20 / RECENCY_DAYS);

  return Math.round((frequencyScore + stabilityScore + recencyScore) * 100) / 100;
}
