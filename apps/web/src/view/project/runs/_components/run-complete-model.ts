import type { RunComparison, TestCaseRunDetail } from '@/entities/test-run';
import { APP_TIME_ZONE } from '@testea/util';

type ResultStatus = TestCaseRunDetail['status'];

/** 직전 실행과 견준 케이스의 변화 */
export type Transition =
  | 'newFail'
  | 'recovered'
  | 'stillFail'
  | 'blocked'
  | 'na'
  | 'stillPass'
  | 'untested';

export const classifyTransition = (
  current: ResultStatus,
  previous: ResultStatus | undefined
): Transition => {
  if (current === 'untested') return 'untested';
  if (current === 'blocked') return 'blocked';
  if (current === 'na') return 'na';
  if (current === 'fail') return previous === 'fail' ? 'stillFail' : 'newFail';
  return previous === 'fail' || previous === 'blocked' ? 'recovered' : 'stillPass';
};

export interface TransitionTab {
  value: Transition;
  label: string;
}

/** 직전 실행이 없으면 변화가 아니라 결과로 나눈다. */
export const transitionTabsOf = (hasPrevious: boolean): TransitionTab[] =>
  hasPrevious
    ? [
        { value: 'newFail', label: '새로 실패' },
        { value: 'recovered', label: '복구' },
        { value: 'stillFail', label: '계속 실패' },
        { value: 'blocked', label: '차단' },
        { value: 'na', label: 'N/A' },
        { value: 'stillPass', label: '그대로 통과' },
        { value: 'untested', label: '미실행' },
      ]
    : [
        { value: 'newFail', label: '실패' },
        { value: 'blocked', label: '차단' },
        { value: 'na', label: 'N/A' },
        { value: 'stillPass', label: '통과' },
        { value: 'untested', label: '미실행' },
      ];

export const transitionOf = (tc: TestCaseRunDetail, comparison: RunComparison | undefined) =>
  classifyTransition(tc.status, comparison?.previousByCase[tc.testCaseId]?.status);

export interface SuiteDelta {
  key: string;
  name: string;
  total: number;
  pass: number;
  fail: number;
  blocked: number;
  na: number;
  newFail: number;
  recovered: number;
  passRate: number;
}

/** 스위트별 결과와 변화. 변화가 큰 순서로 정렬한다. */
export const summarizeSuiteDeltas = (
  cases: TestCaseRunDetail[],
  comparison: RunComparison | undefined
): SuiteDelta[] => {
  const bySuite = new Map<string, SuiteDelta>();
  for (const tc of cases) {
    const key = tc.testSuiteId ?? '__unclassified__';
    const delta = bySuite.get(key) ?? {
      key,
      name: tc.testSuiteName ?? '미분류',
      total: 0,
      pass: 0,
      fail: 0,
      blocked: 0,
      na: 0,
      newFail: 0,
      recovered: 0,
      passRate: 0,
    };
    delta.total += 1;
    if (tc.status === 'pass') delta.pass += 1;
    if (tc.status === 'fail') delta.fail += 1;
    if (tc.status === 'blocked') delta.blocked += 1;
    if (tc.status === 'na') delta.na += 1;
    const transition = transitionOf(tc, comparison);
    if (transition === 'newFail') delta.newFail += 1;
    if (transition === 'recovered') delta.recovered += 1;
    bySuite.set(key, delta);
  }
  const deltas = [...bySuite.values()].map((d) => ({
    ...d,
    // N/A 는 통과율 분모에서 뺀다 (06k).
    passRate: d.total - d.na > 0 ? Math.round((d.pass / (d.total - d.na)) * 100) : 0,
  }));
  const weight = (d: SuiteDelta) => d.newFail * 3 + d.recovered * 2 + d.blocked + d.fail;
  return deltas.sort((a, b) => weight(b) - weight(a) || a.name.localeCompare(b.name));
};

export const hasSuiteChange = (delta: SuiteDelta) =>
  delta.newFail > 0 || delta.recovered > 0 || delta.blocked > 0 || delta.fail > 0;

export type HistoryTone = 'fail' | 'pass' | 'blocked' | 'neutral';

/** 최근 결과(오래된 것부터, 마지막이 이번 결과) 한 줄 요약. */
export const summarizeHistory = (
  statuses: ResultStatus[]
): { text: string; tone: HistoryTone } | null => {
  // N/A 는 판정이 아니라 확인할 수 없던 기록이라 흐름 요약에서 뺀다 (06k).
  const executed = statuses.filter((s) => s !== 'untested' && s !== 'na');
  const n = executed.length;
  if (n < 2) return null;
  const last = executed[n - 1];
  const before = executed.slice(0, -1);
  const count = (status: ResultStatus) => executed.filter((s) => s === status).length;

  if (last === 'fail') {
    if (before.every((s) => s === 'pass')) return { text: `${n}회 만에 처음 실패`, tone: 'fail' };
    return { text: `최근 ${n}회 중 ${count('fail')}회 실패`, tone: 'fail' };
  }
  if (last === 'pass') {
    if (before.every((s) => s === 'pass')) return { text: `${n}회 연속 통과`, tone: 'pass' };
    if (before[before.length - 1] !== 'pass') return { text: '직전 결과에서 복구', tone: 'pass' };
    return { text: `최근 ${n}회 중 ${count('pass')}회 통과`, tone: 'neutral' };
  }
  return { text: `최근 ${n}회 중 ${count('blocked')}회 차단`, tone: 'blocked' };
};

const DAY_MS = 24 * 60 * 60 * 1000;

const dateTimeParts = (date: Date) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: APP_TIME_ZONE,
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return `${get('month')}.${get('day')} ${get('hour')}:${get('minute')}`;
};

/** 'MM.DD' (서비스 시간대) */
export const shortDateOf = (date: Date) => dateTimeParts(date).slice(0, 5);

/** 실행 기간 '10.09 14:20 → 10.11 18:40 · 2일 4시간'. 결과가 없으면 시작 시각만. */
export const runPeriodOf = (createdAt: Date, cases: TestCaseRunDetail[]): string => {
  const start = new Date(createdAt);
  const executed = cases
    .map((tc) => (tc.executedAt ? new Date(tc.executedAt).getTime() : 0))
    .filter((t) => t > 0);
  if (executed.length === 0) return `${dateTimeParts(start)} 시작`;
  const end = new Date(Math.max(...executed));
  const minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
  const days = Math.floor((minutes * 60000) / DAY_MS);
  const hours = Math.floor((minutes % (24 * 60)) / 60);
  const mins = minutes % 60;
  const duration =
    days > 0
      ? `${days}일${hours > 0 ? ` ${hours}시간` : ''}`
      : hours > 0
        ? `${hours}시간${mins > 0 ? ` ${mins}분` : ''}`
        : `${Math.max(1, mins)}분`;
  return `${dateTimeParts(start)} → ${dateTimeParts(end)} · ${duration}`;
};

export interface BlockedGroup {
  /** 사유(앞뒤 공백 제거한 메모). 메모가 없으면 null */
  reason: string | null;
  cases: TestCaseRunDetail[];
  suiteNames: string[];
  /** 이 사유로 가장 먼저 기록한 시각 */
  firstRecordedAt: Date | null;
}

export const blockedGroupKey = (reason: string | null) => reason ?? '__no_reason__';

/** 차단 케이스를 사유별로 묶는다 (06h). 건수가 많은 사유부터, 사유 미기록은 맨 뒤. */
export const groupBlockedByReason = (cases: TestCaseRunDetail[]): BlockedGroup[] => {
  const groups = new Map<string, BlockedGroup>();
  for (const tc of cases) {
    if (tc.status !== 'blocked') continue;
    const reason = tc.comment?.trim() || null;
    const key = blockedGroupKey(reason);
    const group = groups.get(key) ?? { reason, cases: [], suiteNames: [], firstRecordedAt: null };
    group.cases.push(tc);
    const suiteName = tc.testSuiteName ?? '미분류';
    if (!group.suiteNames.includes(suiteName)) group.suiteNames.push(suiteName);
    if (tc.executedAt) {
      const at = new Date(tc.executedAt);
      if (!group.firstRecordedAt || at < group.firstRecordedAt) group.firstRecordedAt = at;
    }
    groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => {
    if (!a.reason !== !b.reason) return a.reason ? -1 : 1;
    return b.cases.length - a.cases.length || (a.reason ?? '').localeCompare(b.reason ?? '');
  });
};

/** 'MM.DD HH:mm' (서비스 시간대) */
export const shortDateTimeOf = (date: Date) => dateTimeParts(date);
