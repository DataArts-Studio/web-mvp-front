import { describe, expect, it } from 'vitest';

import { buildCandidateDecision, computeScore, evaluateReasons, wilsonLowerBound } from './score';

const base = {
  distinctRuns: 0,
  evaluatedResults: 0,
  passCount: 0,
  failCount: 0,
  blockedCount: 0,
  passRate: 0,
  daysSinceLastRun: null as number | null,
};

describe('evaluateReasons', () => {
  it('빈도·표본·안정·최근 신호를 보수적으로 판정한다', () => {
    const r = evaluateReasons({
      ...base,
      distinctRuns: 12,
      evaluatedResults: 12,
      passCount: 12,
      passRate: 1,
      daysSinceLastRun: 4,
    });
    expect(r).toEqual({
      frequent: true,
      enoughHistory: true,
      stable: true,
      lowBlocked: true,
      recent: true,
      flaky: false,
    });
  });

  it('빈도 미달이면 frequent=false', () => {
    const r = evaluateReasons({
      ...base,
      distinctRuns: 2,
      evaluatedResults: 10,
      passCount: 10,
      passRate: 1,
      daysSinceLastRun: 1,
    });
    expect(r.frequent).toBe(false);
  });

  it('표본이 적으면 pass 100%여도 stable=false', () => {
    const r = evaluateReasons({
      ...base,
      distinctRuns: 3,
      evaluatedResults: 3,
      passCount: 3,
      passRate: 1,
      daysSinceLastRun: 1,
    });
    expect(r.enoughHistory).toBe(false);
    expect(r.stable).toBe(false);
  });

  it('blocked 비율이 높으면 stable=false', () => {
    const r = evaluateReasons({
      ...base,
      distinctRuns: 10,
      evaluatedResults: 10,
      passCount: 8,
      blockedCount: 2,
      passRate: 0.8,
      daysSinceLastRun: 1,
    });
    expect(r.lowBlocked).toBe(true);
    expect(r.stable).toBe(false);
  });

  it('마지막 실행이 30일 초과면 recent=false', () => {
    const r = evaluateReasons({
      ...base,
      distinctRuns: 12,
      evaluatedResults: 12,
      passCount: 12,
      passRate: 1,
      daysSinceLastRun: 31,
    });
    expect(r.recent).toBe(false);
  });

  it('실행 이력이 없으면(daysSinceLastRun=null) recent=false', () => {
    const r = evaluateReasons({
      ...base,
      distinctRuns: 12,
      evaluatedResults: 12,
      passCount: 12,
      passRate: 1,
      daysSinceLastRun: null,
    });
    expect(r.recent).toBe(false);
  });

  it('pass·fail 공존 + passRate<ceiling 이면 flaky', () => {
    const r = evaluateReasons({
      ...base,
      distinctRuns: 10,
      evaluatedResults: 10,
      passCount: 6,
      failCount: 4,
      passRate: 0.6,
      daysSinceLastRun: 1,
    });
    expect(r.flaky).toBe(true);
  });

  it('fail 이 없으면 passRate 가 낮아도 flaky 아님', () => {
    const r = evaluateReasons({
      ...base,
      passCount: 4,
      failCount: 0,
      evaluatedResults: 10,
      passRate: 0.4,
      daysSinceLastRun: 1,
    });
    expect(r.flaky).toBe(false);
  });

  it('passRate 가 ceiling 이상이면 fail 이 있어도 flaky 아님', () => {
    const r = evaluateReasons({
      ...base,
      passCount: 9,
      failCount: 1,
      evaluatedResults: 10,
      passRate: 0.9,
      daysSinceLastRun: 1,
    });
    expect(r.flaky).toBe(false);
  });
});

describe('computeScore', () => {
  it('실행이 많을수록 점수가 높다', () => {
    const low = computeScore({
      ...base,
      distinctRuns: 3,
      evaluatedResults: 10,
      passCount: 10,
      passRate: 1,
      daysSinceLastRun: 1,
    });
    const high = computeScore({
      ...base,
      distinctRuns: 10,
      evaluatedResults: 10,
      passCount: 10,
      passRate: 1,
      daysSinceLastRun: 1,
    });
    expect(high).toBeGreaterThan(low);
  });

  it('최근일수록 점수가 높다', () => {
    const stale = computeScore({
      ...base,
      distinctRuns: 5,
      evaluatedResults: 10,
      passCount: 10,
      passRate: 1,
      daysSinceLastRun: 29,
    });
    const fresh = computeScore({
      ...base,
      distinctRuns: 5,
      evaluatedResults: 10,
      passCount: 10,
      passRate: 1,
      daysSinceLastRun: 1,
    });
    expect(fresh).toBeGreaterThan(stale);
  });

  it('fail 과 blocked 가 있으면 점수가 낮아진다', () => {
    const clean = computeScore({
      ...base,
      distinctRuns: 8,
      evaluatedResults: 10,
      passCount: 10,
      passRate: 1,
      daysSinceLastRun: 1,
    });
    const noisy = computeScore({
      ...base,
      distinctRuns: 8,
      evaluatedResults: 10,
      passCount: 7,
      failCount: 2,
      blockedCount: 1,
      passRate: 0.7,
      daysSinceLastRun: 1,
    });
    expect(clean).toBeGreaterThan(noisy);
  });
});

describe('buildCandidateDecision', () => {
  it('안정적인 반복 케이스를 높은 우선순위와 높은 신뢰도로 설명한다', () => {
    const input = {
      ...base,
      distinctRuns: 12,
      evaluatedResults: 12,
      passCount: 12,
      passRate: 1,
      daysSinceLastRun: 2,
    };
    const reasons = evaluateReasons(input);
    const decision = buildCandidateDecision(input, reasons, computeScore(input));

    expect(decision.priority).toBe('high');
    expect(decision.confidence).toBe('high');
    expect(decision.estimatedManualRunsSaved).toBe(11);
    expect(decision.signalLabels).toContain('충분한 표본');
    expect(decision.signalLabels).toContain('blocked 없음');
    expect(decision.riskLabels).toHaveLength(0);
  });

  it('불안정한 케이스는 위험 신호와 검토 사유를 제공한다', () => {
    const input = {
      ...base,
      distinctRuns: 7,
      evaluatedResults: 8,
      passCount: 5,
      failCount: 2,
      blockedCount: 1,
      passRate: 0.625,
      daysSinceLastRun: 34,
    };
    const reasons = evaluateReasons(input);
    const decision = buildCandidateDecision(input, reasons, computeScore(input));

    expect(decision.confidence).toBe('low');
    expect(decision.riskLabels).toEqual(['fail 2건', 'blocked 1건', '최근성 낮음']);
    expect(decision.recommendationReason).toBe(
      '결과가 흔들려 자동화보다 안정화가 먼저 필요합니다.'
    );
  });
});
describe('wilsonLowerBound', () => {
  it('표본이 적은 100% pass 를 보수적으로 낮춘다', () => {
    expect(wilsonLowerBound(3, 3)).toBeLessThan(0.65);
    expect(wilsonLowerBound(12, 12)).toBeGreaterThan(0.65);
  });
});
