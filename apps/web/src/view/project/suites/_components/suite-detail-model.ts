import type { TestCaseResultStatus } from '@/entities/test-case';
import type { TestSuiteCard } from '@/entities/test-suite';

type RecentRun = TestSuiteCard['recentRuns'][number];

/** 실행 한 번의 통과율(%). 목록의 통과율과 같은 기준(통과 / 전체). 케이스가 없으면 null. */
export const runPassRateOf = (run: RecentRun): number | null =>
  run.total > 0 ? Math.round((run.passed / run.total) * 100) : null;

/** 요약 카드에서 '최근 몇 회 중' 을 셀 때 쓰는 회차 수 */
export const RECENT_WINDOW = 6;

export type SuiteRunSummary = {
  /** 마지막 실행 통과율 */
  lastRate: number | null;
  /** 마지막 실행 바로 전 회차 통과율 */
  prevRate: number | null;
  /** 실패가 하나라도 있었던 회차 수 (최근 30회 안) */
  failedRuns: number;
  totalRuns: number;
  /** 최근 RECENT_WINDOW 회 중 실패가 있었던 회차 수 */
  recentFailedRuns: number;
  recentWindow: number;
  lastRun: RecentRun | null;
};

/** recentRuns 는 최근 것부터 온다. */
export const summarizeSuiteRuns = (recentRuns: RecentRun[]): SuiteRunSummary => {
  const recentWindow = Math.min(RECENT_WINDOW, recentRuns.length);
  return {
    lastRate: recentRuns[0] ? runPassRateOf(recentRuns[0]) : null,
    prevRate: recentRuns[1] ? runPassRateOf(recentRuns[1]) : null,
    failedRuns: recentRuns.filter((run) => run.failed > 0).length,
    totalRuns: recentRuns.length,
    recentFailedRuns: recentRuns.slice(0, recentWindow).filter((run) => run.failed > 0).length,
    recentWindow,
    lastRun: recentRuns[0] ?? null,
  };
};

/**
 * 주의할 케이스의 이유. 앞에 있을수록 먼저 보여 준다.
 * - newFail: 직전 결과는 통과였는데 마지막에 실패
 * - stillFailing: 마지막 두 번 연속 실패
 * - flaky: 최근 결과에 통과와 실패가 섞여 있고 실패가 2번 이상
 * - automation: 최근 5회 연속 통과(자동화 후보)
 */
export type WatchReason =
  | { kind: 'newFail' }
  | { kind: 'stillFailing'; streak: number }
  | { kind: 'flaky'; fails: number; total: number }
  | { kind: 'automation'; streak: number };

const ORDER: WatchReason['kind'][] = ['newFail', 'stillFailing', 'flaky', 'automation'];

/** 최근 결과(오래된 것부터)로 주의할 이유를 하나 고른다. 없으면 null. */
export const watchReasonOf = (results: TestCaseResultStatus[]): WatchReason | null => {
  const recorded = results.filter((status) => status !== 'untested');
  if (recorded.length === 0) return null;
  const last = recorded[recorded.length - 1];
  const prev = recorded[recorded.length - 2];

  if (last === 'fail' && prev === 'pass') return { kind: 'newFail' };
  if (last === 'fail' && prev === 'fail') {
    let streak = 0;
    for (let i = recorded.length - 1; i >= 0 && recorded[i] === 'fail'; i--) streak++;
    return { kind: 'stillFailing', streak };
  }
  const fails = recorded.filter((status) => status === 'fail').length;
  if (fails >= 2 && recorded.includes('pass')) {
    return { kind: 'flaky', fails, total: recorded.length };
  }
  let passStreak = 0;
  for (let i = recorded.length - 1; i >= 0 && recorded[i] === 'pass'; i--) passStreak++;
  if (passStreak >= 5) return { kind: 'automation', streak: passStreak };
  return null;
};

/** 주의할 케이스를 이유 순서대로 최대 limit 개 고른다. */
export const pickWatchCases = <T extends { id: string; recentResults?: TestCaseResultStatus[] }>(
  cases: T[],
  limit = 3
): { testCase: T; reason: WatchReason }[] => {
  const picked = cases
    .map((testCase) => ({ testCase, reason: watchReasonOf(testCase.recentResults ?? []) }))
    .filter((item): item is { testCase: T; reason: WatchReason } => item.reason !== null);
  return picked
    .sort((a, b) => ORDER.indexOf(a.reason.kind) - ORDER.indexOf(b.reason.kind))
    .slice(0, limit);
};
