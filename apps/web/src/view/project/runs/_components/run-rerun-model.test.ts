import type { RunComparison, TestCaseRunDetail } from '@/entities/test-run';
import { describe, expect, it } from 'vitest';

import { buildRerunGroups, nextRunNameOf } from './run-rerun-model';

const makeCase = (id: string, status: TestCaseRunDetail['status'], comment: string | null = null) =>
  ({ id, testCaseId: `tc-${id}`, status, comment }) as TestCaseRunDetail;

const comparisonWith = (previous: Record<string, TestCaseRunDetail['status']>) =>
  ({
    previous: { id: 'prev', name: '1차', createdAt: new Date(), passRate: 90 },
    previousByCase: Object.fromEntries(
      Object.entries(previous).map(([id, status]) => [
        `tc-${id}`,
        { status, comment: null, executedAt: null },
      ])
    ),
    historyByCase: {},
    blockedHistory: [],
  }) as RunComparison;

describe('nextRunNameOf', () => {
  it('끝이 N차면 다음 차수로 바꾼다', () => {
    expect(nextRunNameOf('v2.1 회귀 - 2차')).toBe('v2.1 회귀 - 3차');
    expect(nextRunNameOf('스모크 9 차')).toBe('스모크 10차');
  });

  it('차수가 없으면 뒤에 재실행을 붙이고 길이 제한을 지킨다', () => {
    expect(nextRunNameOf('릴리스 점검')).toBe('릴리스 점검 재실행');
    expect(nextRunNameOf('가'.repeat(100))).toHaveLength(100);
  });
});

describe('buildRerunGroups', () => {
  it('직전 실행 대비 변화로 묶고 다시 볼 이유가 큰 순서로 두며 빈 묶음은 뺀다', () => {
    const cases = [
      makeCase('a', 'pass'),
      makeCase('b', 'fail'),
      makeCase('c', 'fail'),
      makeCase('d', 'blocked', '환경 없음'),
      makeCase('e', 'blocked', ' 환경 없음 '),
      makeCase('f', 'pass'),
    ];
    const groups = buildRerunGroups(cases, comparisonWith({ a: 'pass', c: 'fail', f: 'fail' }));
    expect(groups.map((g) => [g.value, g.cases.map((tc) => tc.id)])).toEqual([
      ['newFail', ['b']],
      ['stillFail', ['c']],
      ['blocked', ['d', 'e']],
      ['recovered', ['f']],
      ['stillPass', ['a']],
    ]);
    expect(groups.find((g) => g.value === 'blocked')?.hint).toBe('사유 1종');
  });

  it('직전 실행이 없으면 결과 이름으로 묶는다', () => {
    const groups = buildRerunGroups(
      [makeCase('a', 'pass'), makeCase('b', 'fail'), makeCase('c', 'untested')],
      undefined
    );
    expect(groups.map((g) => g.label)).toEqual(['실패', '미실행', '통과']);
  });
});
