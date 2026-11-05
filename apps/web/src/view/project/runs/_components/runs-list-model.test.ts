import { describe, expect, it } from 'vitest';

import type { ITestRun } from './runs-list-constants';
import {
  comparisonLabelOf,
  groupRuns,
  milestoneOverdueDays,
  passRateOf,
  summarizeActivity,
  timeLabelOf,
} from './runs-list-model';

// 2026-10-14(수) 15:00 KST
const NOW = new Date('2026-10-14T06:00:00Z');

const makeRun = (overrides: Partial<ITestRun> = {}): ITestRun => ({
  id: overrides.id ?? Math.random().toString(36).slice(2),
  name: 'run',
  status: 'COMPLETED',
  sourceType: 'SUITE',
  sourceName: '인증',
  sourceKey: 'suites:a',
  milestoneEndDate: null,
  createdAt: new Date('2026-10-14T00:00:00Z'),
  updatedAt: new Date('2026-10-14T01:00:00Z'),
  stats: {
    totalCases: 10,
    completedCases: 10,
    progressPercent: 100,
    pass: 8,
    fail: 1,
    blocked: 1,
    na: 0,
    untested: 0,
  },
  activity: [],
  ...overrides,
});

describe('groupRuns', () => {
  it('진행 중 실행을 맨 위에 두고 끝난 실행은 KST 날짜 기준으로 묶는다', () => {
    const runs = [
      makeRun({ id: 'open', status: 'IN_PROGRESS' }),
      makeRun({ id: 'not-started', status: 'NOT_STARTED' }),
      // 10/14 00:30 KST 는 UTC 로 10/13 이지만 오늘로 묶여야 한다
      makeRun({ id: 'today', updatedAt: new Date('2026-10-13T15:30:00Z') }),
      makeRun({ id: 'yesterday', updatedAt: new Date('2026-10-13T03:00:00Z') }),
      makeRun({ id: 'this-week', updatedAt: new Date('2026-10-12T03:00:00Z') }),
      makeRun({ id: 'last-week', updatedAt: new Date('2026-10-06T03:00:00Z') }),
      makeRun({ id: 'september', updatedAt: new Date('2026-09-20T03:00:00Z') }),
      makeRun({ id: 'last-year', updatedAt: new Date('2025-12-20T03:00:00Z') }),
    ];

    const groups = groupRuns(runs, NOW);

    expect(groups.map((g) => [g.label, g.runs.map((r) => r.id)])).toEqual([
      ['진행 중', ['open', 'not-started']],
      ['오늘', ['today']],
      ['어제', ['yesterday']],
      ['이번 주', ['this-week']],
      ['지난 주', ['last-week']],
      ['9월', ['september']],
      ['2025년 12월', ['last-year']],
    ]);
  });
});

describe('comparisonLabelOf', () => {
  it('같은 출처의 직전 실행 통과율을 보여 준다', () => {
    const first = makeRun({ id: 'first', createdAt: new Date('2026-10-01T00:00:00Z') });
    const second = makeRun({
      id: 'second',
      createdAt: new Date('2026-10-05T00:00:00Z'),
      stats: { ...first.stats, pass: 9, fail: 1, blocked: 0 },
    });
    const third = makeRun({ id: 'third', createdAt: new Date('2026-10-10T00:00:00Z') });
    const other = makeRun({
      id: 'other',
      sourceKey: 'suites:b',
      createdAt: new Date('2026-10-08T00:00:00Z'),
    });
    const runs = [first, second, third, other];

    expect(comparisonLabelOf(third, runs)).toBe('직전 90%');
    expect(comparisonLabelOf(first, runs)).toBe('첫 회차');
    expect(comparisonLabelOf(other, runs)).toBe('첫 회차');
  });

  it('직접 고른 케이스로 만든 실행은 비교하지 않는다', () => {
    const run = makeRun({ sourceType: 'ADHOC', sourceKey: null });
    expect(comparisonLabelOf(run, [run])).toBeNull();
  });
});

describe('timeLabelOf', () => {
  it('진행 중이면 시작부터 지난 시간을 보여 준다', () => {
    const run = makeRun({ status: 'IN_PROGRESS', createdAt: new Date('2026-10-14T04:00:00Z') });
    expect(timeLabelOf(run, NOW)).toBe('2시간째');
    expect(
      timeLabelOf(
        makeRun({ status: 'IN_PROGRESS', createdAt: new Date('2026-10-12T00:00:00Z') }),
        NOW
      )
    ).toBe('2일째');
  });

  it('오늘 끝난 실행은 KST 시각, 그 전은 날짜를 보여 준다', () => {
    expect(timeLabelOf(makeRun({ updatedAt: new Date('2026-10-14T01:05:00Z') }), NOW)).toBe(
      '10:05'
    );
    expect(timeLabelOf(makeRun({ updatedAt: new Date('2026-10-10T01:05:00Z') }), NOW)).toBe(
      '10.10'
    );
    expect(timeLabelOf(makeRun({ updatedAt: new Date('2025-10-10T01:05:00Z') }), NOW)).toBe(
      '25.10.10'
    );
  });
});

describe('milestoneOverdueDays', () => {
  it('진행 중 실행의 마일스톤 목표일이 지난 날수를 센다', () => {
    const run = makeRun({ status: 'IN_PROGRESS', milestoneEndDate: '2026-10-12' });
    expect(milestoneOverdueDays(run, NOW)).toBe(2);
    expect(milestoneOverdueDays({ ...run, milestoneEndDate: '2026-10-20' }, NOW)).toBe(0);
    expect(milestoneOverdueDays({ ...run, status: 'COMPLETED' }, NOW)).toBe(0);
  });
});

describe('summarizeActivity', () => {
  it('12주를 월요일 시작 열로 만들고 오늘 이후 칸은 비운다', () => {
    const summary = summarizeActivity([], NOW);
    expect(summary.weeks).toHaveLength(12);
    expect(summary.weeks[0][0].date).toBe('2026-07-27');
    const lastWeek = summary.weeks[11];
    expect(lastWeek[0].date).toBe('2026-10-12');
    expect(lastWeek[2]).toMatchObject({ date: '2026-10-14', isToday: true, future: false });
    expect(lastWeek[3].future).toBe(true);
    expect(summary.periodDays).toBe(80);
    expect(summary.longestGap).toBeNull();
  });

  it('날짜별 결과를 합쳐 실행한 날, 실패가 있던 날, 가장 길게 쉰 기간을 센다', () => {
    const runs = [
      makeRun({
        activity: [
          { date: '2026-09-01', pass: 5, fail: 0, blocked: 0 },
          { date: '2026-09-11', pass: 1, fail: 1, blocked: 0 },
        ],
      }),
      makeRun({
        activity: [
          { date: '2026-09-11', pass: 10, fail: 0, blocked: 0 },
          { date: '2026-09-13', pass: 0, fail: 0, blocked: 2 },
          // 기간 밖 기록은 무시한다
          { date: '2026-01-01', pass: 3, fail: 3, blocked: 0 },
        ],
      }),
    ];

    const summary = summarizeActivity(runs, NOW);
    const cells = summary.weeks.flat();
    const cell = (date: string) => cells.find((c) => c.date === date)!;

    expect(summary.executedDays).toBe(3);
    expect(summary.failDays).toBe(1);
    expect(cell('2026-09-11')).toMatchObject({ total: 12, tone: 'fail', level: 3 });
    expect(cell('2026-09-13')).toMatchObject({ tone: 'blocked', level: 1 });
    expect(cell('2026-09-01')).toMatchObject({ tone: 'pass', level: 2 });
    // 9/2 ~ 9/10 사이 9일
    expect(summary.longestGap).toEqual({ days: 9, label: '9월 초' });
  });
});

describe('passRateOf', () => {
  it('N/A 는 통과율 분모에서 뺀다', () => {
    const run = makeRun({
      stats: {
        totalCases: 10,
        completedCases: 10,
        progressPercent: 100,
        pass: 6,
        fail: 1,
        blocked: 1,
        na: 2,
        untested: 0,
      },
    });
    expect(passRateOf(run.stats)).toBe(75);
  });

  it('모두 N/A 면 null', () => {
    const run = makeRun({
      stats: {
        totalCases: 2,
        completedCases: 2,
        progressPercent: 100,
        pass: 0,
        fail: 0,
        blocked: 0,
        na: 2,
        untested: 0,
      },
    });
    expect(passRateOf(run.stats)).toBeNull();
  });
});
