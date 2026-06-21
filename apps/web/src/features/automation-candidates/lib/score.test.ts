import { describe, expect, it } from 'vitest';

import { computeScore, evaluateReasons } from './score';

const base = {
  distinctRuns: 0,
  evaluatedResults: 0,
  passCount: 0,
  failCount: 0,
  passRate: 0,
  daysSinceLastRun: null as number | null,
};

describe('evaluateReasons', () => {
  it('빈도·안정·최근 3신호를 임계로 판정한다', () => {
    const r = evaluateReasons({
      ...base,
      distinctRuns: 5,
      evaluatedResults: 5,
      passCount: 5,
      passRate: 1,
      daysSinceLastRun: 4,
    });
    expect(r).toEqual({ frequent: true, stable: true, recent: true, flaky: false });
  });

  it('빈도 미달이면 frequent=false', () => {
    const r = evaluateReasons({ ...base, distinctRuns: 2, passRate: 1, daysSinceLastRun: 1 });
    expect(r.frequent).toBe(false);
  });

  it('마지막 실행이 30일 초과면 recent=false', () => {
    const r = evaluateReasons({ ...base, distinctRuns: 5, passRate: 1, daysSinceLastRun: 31 });
    expect(r.recent).toBe(false);
  });

  it('실행 이력이 없으면(daysSinceLastRun=null) recent=false', () => {
    const r = evaluateReasons({ ...base, distinctRuns: 5, passRate: 1, daysSinceLastRun: null });
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
    const low = computeScore({ ...base, distinctRuns: 3, passRate: 1, daysSinceLastRun: 1 });
    const high = computeScore({ ...base, distinctRuns: 10, passRate: 1, daysSinceLastRun: 1 });
    expect(high).toBeGreaterThan(low);
  });

  it('최근일수록 점수가 높다', () => {
    const stale = computeScore({ ...base, distinctRuns: 5, passRate: 1, daysSinceLastRun: 29 });
    const fresh = computeScore({ ...base, distinctRuns: 5, passRate: 1, daysSinceLastRun: 1 });
    expect(fresh).toBeGreaterThan(stale);
  });

  it('실행 이력이 없으면 최근성 가중은 0', () => {
    const noRun = computeScore({ ...base, distinctRuns: 5, passRate: 1, daysSinceLastRun: null });
    const old = computeScore({ ...base, distinctRuns: 5, passRate: 1, daysSinceLastRun: 30 });
    expect(noRun).toBe(old);
  });
});
