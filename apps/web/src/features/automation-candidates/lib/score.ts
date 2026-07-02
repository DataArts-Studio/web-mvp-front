import type { CandidateDecision, CandidateReasons } from '../types';
import {
  FLAKY_PASS_RATE_CEILING,
  MAX_BLOCKED_RATE,
  MIN_CONFIDENCE_PASS_RATE,
  MIN_DISTINCT_RUNS,
  MIN_EVALUATED_RESULTS,
  MIN_PASS_RATE,
  RECENCY_DAYS,
} from './constants';

export interface ScoreInput {
  distinctRuns: number;
  evaluatedResults: number;
  passCount: number;
  failCount: number;
  blockedCount: number;
  passRate: number;
  daysSinceLastRun: number | null;
}

export function evaluateReasons(input: ScoreInput): CandidateReasons {
  const blockedRate = input.evaluatedResults > 0 ? input.blockedCount / input.evaluatedResults : 0;
  const confidencePassRate = wilsonLowerBound(input.passCount, input.evaluatedResults);

  const frequent = input.distinctRuns >= MIN_DISTINCT_RUNS;
  const enoughHistory = input.evaluatedResults >= MIN_EVALUATED_RESULTS;
  const lowBlocked = blockedRate <= MAX_BLOCKED_RATE;
  const stable =
    enoughHistory &&
    lowBlocked &&
    input.passRate >= MIN_PASS_RATE &&
    confidencePassRate >= MIN_CONFIDENCE_PASS_RATE;
  const recent = input.daysSinceLastRun !== null && input.daysSinceLastRun <= RECENCY_DAYS;
  const flaky =
    input.passCount > 0 && input.failCount > 0 && input.passRate < FLAKY_PASS_RATE_CEILING;

  return { frequent, enoughHistory, stable, lowBlocked, recent, flaky };
}

export function computeScore(input: ScoreInput): number {
  const confidencePassRate = wilsonLowerBound(input.passCount, input.evaluatedResults);
  const blockedRate = input.evaluatedResults > 0 ? input.blockedCount / input.evaluatedResults : 0;

  const frequencyScore = Math.min(input.distinctRuns, 12) * 8;
  const stabilityScore = confidencePassRate * 70;
  const rawPassRateScore = input.passRate * 20;
  const recencyScore =
    input.daysSinceLastRun === null
      ? 0
      : Math.max(0, RECENCY_DAYS - input.daysSinceLastRun) * (20 / RECENCY_DAYS);
  const failurePenalty = input.failCount * 8;
  const blockedPenalty = blockedRate * 30;

  return (
    Math.round(
      (frequencyScore +
        stabilityScore +
        rawPassRateScore +
        recencyScore -
        failurePenalty -
        blockedPenalty) *
        100
    ) / 100
  );
}

export function buildCandidateDecision(
  input: ScoreInput,
  reasons: CandidateReasons,
  score: number
): CandidateDecision {
  const priority = score >= 150 ? 'high' : score >= 105 ? 'medium' : 'low';
  const confidence = reasons.stable && input.evaluatedResults >= 10 ? 'high' : reasons.stable ? 'medium' : 'low';
  const estimatedManualRunsSaved = Math.max(0, input.distinctRuns - 1);

  const signalLabels = [
    `${input.distinctRuns}회 반복 실행`,
    `${Math.round(input.passRate * 100)}% pass`,
  ];

  if (input.evaluatedResults >= 10) signalLabels.push('충분한 표본');
  if (reasons.recent) signalLabels.push('최근 실행됨');
  if (input.blockedCount === 0) signalLabels.push('blocked 없음');

  const riskLabels: string[] = [];
  if (input.failCount > 0) riskLabels.push(`fail ${input.failCount}건`);
  if (input.blockedCount > 0) riskLabels.push(`blocked ${input.blockedCount}건`);
  if (!reasons.enoughHistory) riskLabels.push('표본 부족');
  if (!reasons.recent) riskLabels.push('최근성 낮음');

  return {
    priority,
    confidence,
    estimatedManualRunsSaved,
    recommendationReason: buildRecommendationReason(input, reasons),
    signalLabels,
    riskLabels,
  };
}

function buildRecommendationReason(input: ScoreInput, reasons: CandidateReasons): string {
  if (reasons.flaky) {
    return '결과가 흔들려 자동화보다 안정화가 먼저 필요합니다.';
  }

  if (reasons.stable && reasons.frequent) {
    return '반복 실행되고 결과가 안정적이라 회귀 자동화 우선순위가 높습니다.';
  }

  if (reasons.frequent && !reasons.stable) {
    return '반복 실행은 많지만 실패나 blocked 이력이 있어 검토가 필요합니다.';
  }

  if (input.evaluatedResults > 0) {
    return '실행 이력은 있으나 자동화 후보 기준을 일부만 충족합니다.';
  }

  return '실행 이력이 부족해 후보 판단을 보류합니다.';
}

export function wilsonLowerBound(passCount: number, total: number): number {
  if (total <= 0) return 0;
  const z = 1.96;
  const p = passCount / total;
  const denominator = 1 + (z * z) / total;
  const centre = p + (z * z) / (2 * total);
  const margin = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * total)) / total);
  return Math.max(0, (centre - margin) / denominator);
}
