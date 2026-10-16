import type { MilestoneWithStats } from '@/entities/milestone';
import { toDateOnly } from '@/shared/lib/date-only';

import { daysBetween } from './milestone-list-model';

type MilestoneCase = NonNullable<MilestoneWithStats['testCases']>[number];

const toDay = (value: Date | string | null | undefined) =>
  value ? toDateOnly(new Date(value)) : null;

const addDays = (dateOnly: string, days: number) => {
  const [y, m, d] = dateOnly.split('-').map(Number);
  return toDateOnly(new Date(y, m - 1, d + days));
};

export type ProgressPoint = { date: string; executed: number; passed: number };

export type ProgressSeries = {
  start: string;
  end: string;
  total: number;
  /** 시작일부터 오늘(또는 목표일)까지 하루 한 점 */
  points: ProgressPoint[];
  /** 그래프에 오늘 선을 그을 날짜. 기간 밖이면 null */
  today: string | null;
  /** 지금 속도로 모두 실행하면 끝나는 날. 실행이 없거나 이미 끝났으면 null */
  expectedDate: string | null;
};

/**
 * 진행 그래프 데이터. 실행 완료 선은 케이스마다 처음 결과를 남긴 날에 1씩 오르고,
 * 통과 선은 가장 최근 결과가 통과인 케이스를 그 결과의 날에 센다.
 * 시작일·목표일이 없으면 그릴 수 없어 null.
 */
export const buildProgressSeries = (
  milestone: Pick<MilestoneWithStats, 'startDate' | 'endDate' | 'totalCases'>,
  cases: MilestoneCase[],
  today: string
): ProgressSeries | null => {
  const { startDate: start, endDate: end, totalCases: total } = milestone;
  if (!start || !end || end < start || total === 0) return null;

  const firstDays = cases.map((c) => toDay(c.firstExecutedAt)).filter(Boolean) as string[];
  const passDays = cases
    .filter((c) => c.lastStatus === 'pass')
    .map((c) => toDay(c.lastExecutedAt))
    .filter(Boolean) as string[];

  const lastPointDay = today < end ? today : end;
  const points: ProgressPoint[] = [];
  if (lastPointDay >= start) {
    for (let day = start; day <= lastPointDay; day = addDays(day, 1)) {
      points.push({
        date: day,
        executed: firstDays.filter((d) => d <= day).length,
        passed: passDays.filter((d) => d <= day).length,
      });
    }
  }

  const executedNow = firstDays.length;
  const elapsed = daysBetween(start, today);
  let expectedDate: string | null = null;
  if (executedNow > 0 && executedNow < total && elapsed > 0) {
    const perDay = executedNow / elapsed;
    expectedDate = addDays(today, Math.ceil((total - executedNow) / perDay));
  }

  return {
    start,
    end,
    total,
    points,
    today: today >= start && today <= end ? today : null,
    expectedDate,
  };
};

export type MilestoneRisks = {
  /** 가장 최근 결과가 실패인 케이스 */
  failing: number;
  /** 가장 최근 결과가 차단인데 메모가 없는 케이스 */
  blockedWithoutReason: number;
  /** 결과가 없는 케이스 */
  untested: number;
  /** 목표일까지 남은 날 (오늘 포함). 지났거나 목표일이 없으면 null */
  daysLeft: number | null;
  /** 남은 날 안에 끝내려면 하루에 실행할 건수 */
  perDayNeeded: number | null;
};

export const summarizeRisks = (
  milestone: Pick<MilestoneWithStats, 'endDate'>,
  cases: MilestoneCase[],
  today: string
): MilestoneRisks => {
  const failing = cases.filter((c) => c.lastStatus === 'fail').length;
  const blockedWithoutReason = cases.filter(
    (c) => c.lastStatus === 'blocked' && !c.lastComment
  ).length;
  const untested = cases.filter((c) => !c.lastStatus || c.lastStatus === 'untested').length;
  const daysLeft =
    milestone.endDate && milestone.endDate >= today
      ? daysBetween(today, milestone.endDate) + 1
      : null;
  return {
    failing,
    blockedWithoutReason,
    untested,
    daysLeft,
    perDayNeeded: daysLeft && untested > 0 ? Math.ceil(untested / daysLeft) : null,
  };
};

export type SuiteProgress = {
  id: string | null;
  title: string;
  total: number;
  pass: number;
  fail: number;
  blocked: number;
};

/** 스위트별 진행. 직접 추가한 케이스는 id null 묶음으로 맨 뒤에 둔다. */
export const progressBySuite = (
  suites: NonNullable<MilestoneWithStats['testSuites']>,
  cases: MilestoneCase[]
): SuiteProgress[] => {
  const rows = new Map<string | null, SuiteProgress>();
  for (const suite of suites) {
    rows.set(suite.id, {
      id: suite.id,
      title: suite.title,
      total: 0,
      pass: 0,
      fail: 0,
      blocked: 0,
    });
  }
  for (const c of cases) {
    const key = c.suiteId ?? null;
    let row = rows.get(key);
    if (!row) {
      row = { id: key, title: '', total: 0, pass: 0, fail: 0, blocked: 0 };
      rows.set(key, row);
    }
    row.total += 1;
    if (c.lastStatus === 'pass') row.pass += 1;
    else if (c.lastStatus === 'fail') row.fail += 1;
    else if (c.lastStatus === 'blocked') row.blocked += 1;
  }
  const direct = rows.get(null);
  rows.delete(null);
  return [...rows.values(), ...(direct ? [direct] : [])];
};
