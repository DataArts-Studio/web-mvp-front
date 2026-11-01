import type { TestSuiteCard } from '@/entities/test-suite';

/** 이력 띠에 그리는 실행 칸 수 (서버도 스위트마다 최근 30회를 준다) */
export const HISTORY_SLOTS = 30;

export type SuiteHealth = 'issue' | 'ok' | 'none';
export type SuiteListTab = 'all' | SuiteHealth;
export type SuiteSort = 'recent' | 'name' | 'passRate';

type RecentRun = TestSuiteCard['recentRuns'][number];

const recordedOf = (last: NonNullable<TestSuiteCard['lastRun']>) =>
  last.counts.passed + last.counts.failed + last.counts.blocked;

/**
 * 마지막 실행 기준 상태. 실패나 차단이 하나라도 있으면 이슈, 모두 통과면 정상.
 * 실행이 없거나 아직 결과를 하나도 기록하지 않았으면 이력 없음.
 */
export const suiteHealthOf = (suite: TestSuiteCard): SuiteHealth => {
  const last = suite.lastRun;
  if (!last || recordedOf(last) === 0) return 'none';
  return last.counts.failed > 0 || last.counts.blocked > 0 ? 'issue' : 'ok';
};

/** 마지막 실행의 통과율(%). 기록한 결과가 없으면 null. */
export const lastPassRateOf = (suite: TestSuiteCard): number | null => {
  const last = suite.lastRun;
  if (!last || recordedOf(last) === 0 || last.total === 0) return null;
  return Math.round((last.counts.passed / last.total) * 100);
};

const lastRunTime = (suite: TestSuiteCard) =>
  suite.lastExecutedAt
    ? new Date(suite.lastExecutedAt).getTime()
    : suite.lastRun
      ? new Date(suite.lastRun.runAt).getTime()
      : 0;

export const sortSuites = (suites: TestSuiteCard[], sort: SuiteSort): TestSuiteCard[] => {
  const list = [...suites];
  if (sort === 'name') return list.sort((a, b) => a.title.localeCompare(b.title));
  if (sort === 'passRate') {
    // 통과율 낮은 순. 기록 없는 스위트는 맨 뒤.
    return list.sort((a, b) => {
      const ra = lastPassRateOf(a);
      const rb = lastPassRateOf(b);
      if (ra === null && rb === null) return a.title.localeCompare(b.title);
      if (ra === null) return 1;
      if (rb === null) return -1;
      return ra - rb || a.title.localeCompare(b.title);
    });
  }
  // 최근 실행 순. 기록 없는 스위트는 맨 뒤.
  return list.sort((a, b) => lastRunTime(b) - lastRunTime(a) || a.title.localeCompare(b.title));
};

/** 이력 띠 칸. 왼쪽이 오래된 것이고, 실행 수가 모자라면 앞쪽을 빈 칸(null)으로 채운다. */
export const historySlotsOf = (
  recentRuns: RecentRun[],
  size: number = HISTORY_SLOTS
): (RecentRun | null)[] => {
  const runs = [...recentRuns].slice(0, size).reverse();
  return [...Array<null>(Math.max(0, size - runs.length)).fill(null), ...runs];
};
