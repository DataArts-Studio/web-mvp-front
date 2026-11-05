import { APP_TIME_ZONE, toAppDateOnly } from '@testea/util';

import type { ITestRun } from './runs-list-constants';

const DAY_MS = 24 * 60 * 60 * 1000;

/** 'YYYY-MM-DD'(서비스 시간대) 를 그날 0시 기준의 일 번호로 바꾼다. 날짜끼리 빼서 일수를 구할 때 쓴다. */
const dayNumber = (date: string) => Math.round(Date.parse(`${date}T00:00:00Z`) / DAY_MS);

const dateOfDayNumber = (day: number) => new Date(day * DAY_MS).toISOString().slice(0, 10);

/** 0=월요일 ... 6=일요일 */
const weekdayOf = (date: string) => (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7;

export const isRunOpen = (run: Pick<ITestRun, 'status'>) => run.status !== 'COMPLETED';

/** 통과율(%). 케이스가 없으면 null. N/A 상태가 생기면 분모에서 뺀다. */
export const passRateOf = (stats: ITestRun['stats']): number | null =>
  stats.totalCases > 0 ? Math.round((stats.pass / stats.totalCases) * 100) : null;

/** 같은 출처로 이 실행보다 먼저 만든 실행 중 가장 최근 것. */
export const findPreviousRun = (run: ITestRun, runs: ITestRun[]): ITestRun | null => {
  if (!run.sourceKey) return null;
  const created = new Date(run.createdAt).getTime();
  let previous: ITestRun | null = null;
  for (const other of runs) {
    if (other.id === run.id || other.sourceKey !== run.sourceKey) continue;
    const otherCreated = new Date(other.createdAt).getTime();
    if (otherCreated >= created) continue;
    if (!previous || otherCreated > new Date(previous.createdAt).getTime()) previous = other;
  }
  return previous;
};

/** 통과율 옆에 붙는 비교 문구. 같은 출처의 직전 실행이 없으면 첫 회차, 직접 고른 실행은 비교하지 않는다. */
export const comparisonLabelOf = (run: ITestRun, runs: ITestRun[]): string | null => {
  if (!run.sourceKey) return null;
  const previous = findPreviousRun(run, runs);
  if (!previous) return '첫 회차';
  const rate = passRateOf(previous.stats);
  return rate === null ? null : `직전 ${rate}%`;
};

export interface RunGroup {
  key: string;
  label: string;
  runs: ITestRun[];
}

const completedGroupOf = (updatedAt: Date, now: Date): { key: string; label: string } => {
  const today = toAppDateOnly(now);
  const date = toAppDateOnly(updatedAt);
  const diff = dayNumber(today) - dayNumber(date);
  if (diff <= 0) return { key: 'today', label: '오늘' };
  if (diff === 1) return { key: 'yesterday', label: '어제' };
  const weekStart = dayNumber(today) - weekdayOf(today);
  if (dayNumber(date) >= weekStart) return { key: 'this-week', label: '이번 주' };
  if (dayNumber(date) >= weekStart - 7) return { key: 'last-week', label: '지난 주' };
  const [year, month] = date.split('-');
  const label = year === today.slice(0, 4) ? `${Number(month)}월` : `${year}년 ${Number(month)}월`;
  return { key: `${year}-${month}`, label };
};

/** 진행 중 묶음을 맨 위에 두고, 끝난 실행은 마지막으로 바뀐 날 기준으로 묶는다. */
export const groupRuns = (runs: ITestRun[], now: Date = new Date()): RunGroup[] => {
  const byUpdated = [...runs].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  const groups: RunGroup[] = [];
  const open = byUpdated.filter(isRunOpen);
  if (open.length > 0) groups.push({ key: 'open', label: '진행 중', runs: open });

  for (const run of byUpdated.filter((r) => !isRunOpen(r))) {
    const { key, label } = completedGroupOf(new Date(run.updatedAt), now);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.runs.push(run);
    else groups.push({ key, label, runs: [run] });
  }
  return groups;
};

const timePartsOf = (date: Date) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: APP_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return `${get('hour')}:${get('minute')}`;
};

/** 진행 중이면 시작부터 지난 시간, 끝났으면 오늘은 시각, 그 전은 날짜. */
export const timeLabelOf = (run: ITestRun, now: Date = new Date()): string => {
  if (isRunOpen(run)) {
    const minutes = Math.max(
      0,
      Math.floor((now.getTime() - new Date(run.createdAt).getTime()) / 60000)
    );
    if (minutes < 60) return `${Math.max(1, minutes)}분째`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간째`;
    return `${Math.floor(hours / 24)}일째`;
  }
  const updated = new Date(run.updatedAt);
  const date = toAppDateOnly(updated);
  const today = toAppDateOnly(now);
  if (date === today) return timePartsOf(updated);
  const [year, month, day] = date.split('-');
  return year === today.slice(0, 4) ? `${month}.${day}` : `${year.slice(2)}.${month}.${day}`;
};

/** 진행 중 실행의 마일스톤 목표일이 지난 날수. 지나지 않았으면 0. */
export const milestoneOverdueDays = (run: ITestRun, now: Date = new Date()): number => {
  if (!isRunOpen(run) || !run.milestoneEndDate) return 0;
  return Math.max(0, dayNumber(toAppDateOnly(now)) - dayNumber(run.milestoneEndDate));
};

// ─── 최근 12주 실행 ───────────────────────────────────────────

export const ACTIVITY_WEEKS = 12;

export type ActivityTone = 'pass' | 'fail' | 'blocked';

export interface ActivityCell {
  date: string;
  /** 오늘 이후 날짜는 칸만 비워 둔다. */
  future: boolean;
  isToday: boolean;
  total: number;
  tone: ActivityTone | null;
  /** 1~3. 기록 건수를 기간 안 최댓값에 견준 단계. 기록이 없으면 0. */
  level: 0 | 1 | 2 | 3;
}

export interface ActivitySummary {
  /** 주 단위 열. 각 열은 월요일부터 일요일까지 7칸. */
  weeks: ActivityCell[][];
  periodDays: number;
  executedDays: number;
  failDays: number;
  longestGap: { days: number; label: string } | null;
}

const periodLabelOf = (date: string) => {
  const [, month, day] = date.split('-').map(Number);
  const part = day <= 10 ? '초' : day <= 20 ? '중순' : '말';
  return `${month}월 ${part}`;
};

/** 실행들의 날짜별 결과 기록을 모아 최근 12주(이번 주 포함) 잔디와 요약 수치를 만든다. */
export const summarizeActivity = (runs: ITestRun[], now: Date = new Date()): ActivitySummary => {
  const today = toAppDateOnly(now);
  const todayNumber = dayNumber(today);
  const firstDay = todayNumber - weekdayOf(today) - (ACTIVITY_WEEKS - 1) * 7;

  const byDate = new Map<string, { pass: number; fail: number; blocked: number }>();
  for (const run of runs) {
    for (const day of run.activity ?? []) {
      const n = dayNumber(day.date);
      if (n < firstDay || n > todayNumber) continue;
      const sum = byDate.get(day.date) ?? { pass: 0, fail: 0, blocked: 0 };
      sum.pass += day.pass;
      sum.fail += day.fail;
      sum.blocked += day.blocked;
      byDate.set(day.date, sum);
    }
  }

  const max = Math.max(0, ...[...byDate.values()].map((d) => d.pass + d.fail + d.blocked));

  const weeks: ActivityCell[][] = [];
  let executedDays = 0;
  let failDays = 0;
  let gap = 0;
  let gapStart = '';
  let longestGap: ActivitySummary['longestGap'] = null;
  let seenExecution = false;

  for (let w = 0; w < ACTIVITY_WEEKS; w++) {
    const column: ActivityCell[] = [];
    for (let d = 0; d < 7; d++) {
      const n = firstDay + w * 7 + d;
      const date = dateOfDayNumber(n);
      const sum = byDate.get(date);
      const total = sum ? sum.pass + sum.fail + sum.blocked : 0;
      const future = n > todayNumber;
      const tone: ActivityTone | null =
        !sum || total === 0 ? null : sum.fail > 0 ? 'fail' : sum.pass === 0 ? 'blocked' : 'pass';
      const ratio = max > 0 ? total / max : 0;
      const level: ActivityCell['level'] =
        total === 0 ? 0 : ratio > 2 / 3 ? 3 : ratio > 1 / 3 ? 2 : 1;
      column.push({ date, future, isToday: n === todayNumber, total, tone, level });

      if (future) continue;
      if (total > 0) {
        executedDays += 1;
        if (tone === 'fail') failDays += 1;
        if (seenExecution && gap > 0 && (!longestGap || gap > longestGap.days)) {
          longestGap = { days: gap, label: periodLabelOf(gapStart) };
        }
        seenExecution = true;
        gap = 0;
      } else if (seenExecution) {
        if (gap === 0) gapStart = date;
        gap += 1;
      }
    }
    weeks.push(column);
  }

  return {
    weeks,
    periodDays: todayNumber - firstDay + 1,
    executedDays,
    failDays,
    longestGap,
  };
};
