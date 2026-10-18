import { describe, expect, it } from 'vitest';

import { buildProgressSeries, progressBySuite, summarizeRisks } from './milestone-detail-model';

const c = (
  id: string,
  lastStatus: string | null,
  first?: string,
  last?: string,
  extra: { suiteId?: string | null; lastComment?: string | null } = {}
) => ({
  id,
  caseKey: id,
  title: id,
  lastStatus,
  firstExecutedAt: first ? new Date(`${first}T10:00:00`) : null,
  lastExecutedAt: last ? new Date(`${last}T10:00:00`) : null,
  ...extra,
});

describe('buildProgressSeries', () => {
  const milestone = { startDate: '2026-10-01', endDate: '2026-10-10', totalCases: 4 };

  it('첫 결과 날에 실행 완료, 최근 결과가 통과인 날에 통과가 오른다', () => {
    const series = buildProgressSeries(
      milestone,
      [
        c('a', 'pass', '2026-10-01', '2026-10-01'),
        c('b', 'fail', '2026-10-02', '2026-10-03'),
        c('c', 'pass', '2026-10-02', '2026-10-04'),
        c('d', null),
      ],
      '2026-10-04'
    )!;
    expect(series.points.map((p) => [p.date, p.executed, p.passed])).toEqual([
      ['2026-10-01', 1, 1],
      ['2026-10-02', 3, 1],
      ['2026-10-03', 3, 1],
      ['2026-10-04', 3, 2],
    ]);
    expect(series.today).toBe('2026-10-04');
    // 3일 동안 3건 → 하루 1건, 남은 1건은 하루 뒤
    expect(series.expectedDate).toBe('2026-10-05');
  });

  it('날짜가 없거나 케이스가 없으면 그리지 않는다', () => {
    expect(buildProgressSeries({ ...milestone, endDate: null }, [], '2026-10-04')).toBeNull();
    expect(buildProgressSeries({ ...milestone, totalCases: 0 }, [], '2026-10-04')).toBeNull();
  });

  it('목표일이 지나면 점은 목표일까지, 오늘 선은 없다', () => {
    const series = buildProgressSeries(milestone, [c('a', 'pass', '2026-10-01')], '2026-10-20')!;
    expect(series.points.at(-1)?.date).toBe('2026-10-10');
    expect(series.today).toBeNull();
  });
});

describe('summarizeRisks', () => {
  it('실패, 메모 없는 차단, 미실행과 하루 필요 건수', () => {
    const risks = summarizeRisks(
      { endDate: '2026-10-05' },
      [
        c('a', 'fail'),
        c('b', 'blocked', undefined, undefined, { lastComment: null }),
        c('c', 'blocked', undefined, undefined, { lastComment: '스테이징 미연동' }),
        c('d', null),
        c('e', null),
        c('f', 'untested'),
      ],
      '2026-10-04'
    );
    expect(risks).toEqual({
      failing: 1,
      blockedWithoutReason: 1,
      untested: 3,
      daysLeft: 2,
      perDayNeeded: 2,
    });
  });
});

describe('progressBySuite', () => {
  it('스위트 순서대로, 직접 추가한 케이스는 맨 뒤 묶음', () => {
    const rows = progressBySuite(
      [
        { id: 's1', title: '인증', description: null },
        { id: 's2', title: '결제', description: null },
      ],
      [
        c('a', 'pass', undefined, undefined, { suiteId: 's2' }),
        c('b', 'fail', undefined, undefined, { suiteId: 's1' }),
        c('d', null, undefined, undefined, { suiteId: null }),
      ]
    );
    expect(rows.map((r) => [r.id, r.total, r.pass, r.fail])).toEqual([
      ['s1', 1, 0, 1],
      ['s2', 1, 1, 0],
      [null, 1, 0, 0],
    ]);
  });
});
