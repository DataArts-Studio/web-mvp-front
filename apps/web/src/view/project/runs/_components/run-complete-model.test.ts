import type { RunComparison, TestCaseRunDetail } from '@/entities/test-run';
import { describe, expect, it } from 'vitest';

import {
  classifyTransition,
  groupBlockedByReason,
  runPeriodOf,
  summarizeHistory,
  summarizeSuiteDeltas,
} from './run-complete-model';

const makeCase = (overrides: Partial<TestCaseRunDetail>): TestCaseRunDetail => ({
  id: overrides.id ?? Math.random().toString(36).slice(2),
  testCaseId: overrides.testCaseId ?? Math.random().toString(36).slice(2),
  code: 'TC-1',
  title: 'case',
  status: 'pass',
  comment: null,
  executedAt: null,
  sourceType: 'suite',
  sourceId: null,
  sourceName: null,
  testSuiteId: 'auth',
  testSuiteName: '인증',
  preCondition: null,
  steps: null,
  expectedResult: null,
  ...overrides,
});

describe('classifyTransition', () => {
  it('직전 결과와 견줘 새 실패, 계속 실패, 복구, 그대로 통과를 나눈다', () => {
    expect(classifyTransition('fail', 'pass')).toBe('newFail');
    expect(classifyTransition('fail', undefined)).toBe('newFail');
    expect(classifyTransition('fail', 'fail')).toBe('stillFail');
    expect(classifyTransition('pass', 'fail')).toBe('recovered');
    expect(classifyTransition('pass', 'blocked')).toBe('recovered');
    expect(classifyTransition('pass', 'pass')).toBe('stillPass');
    expect(classifyTransition('pass', undefined)).toBe('stillPass');
    expect(classifyTransition('blocked', 'fail')).toBe('blocked');
    expect(classifyTransition('untested', 'pass')).toBe('untested');
    expect(classifyTransition('na', 'fail')).toBe('na');
  });
});

describe('summarizeSuiteDeltas', () => {
  it('스위트별 새 실패·복구·통과율을 세고 변화가 큰 순으로 정렬한다', () => {
    const cases = [
      makeCase({ testCaseId: 'a', status: 'fail' }),
      makeCase({ testCaseId: 'b', status: 'pass' }),
      makeCase({ testCaseId: 'c', status: 'pass', testSuiteId: 'pay', testSuiteName: '결제' }),
      makeCase({ testCaseId: 'd', status: 'pass', testSuiteId: 'pay', testSuiteName: '결제' }),
    ];
    const comparison: RunComparison = {
      previous: { id: 'p', name: 'prev', createdAt: new Date(), passRate: 50 },
      previousByCase: {
        a: { status: 'pass', comment: null, executedAt: null },
        b: { status: 'fail', comment: null, executedAt: null },
        c: { status: 'pass', comment: null, executedAt: null },
      },
      historyByCase: {},
    };

    const deltas = summarizeSuiteDeltas(cases, comparison);

    expect(deltas.map((d) => [d.name, d.newFail, d.recovered, d.passRate])).toEqual([
      ['인증', 1, 1, 50],
      ['결제', 0, 0, 100],
    ]);
  });
});

describe('summarizeSuiteDeltas N/A (06k)', () => {
  it('N/A 는 스위트 통과율 분모에서 뺀다', () => {
    const cases = [
      makeCase({ status: 'pass' }),
      makeCase({ status: 'fail' }),
      makeCase({ status: 'na' }),
      makeCase({ status: 'na' }),
    ];
    const [delta] = summarizeSuiteDeltas(cases, undefined);
    expect(delta).toMatchObject({ total: 4, na: 2, passRate: 50 });
  });
});

describe('summarizeHistory', () => {
  it('최근 결과를 한 줄로 요약한다', () => {
    expect(summarizeHistory(['pass', 'pass', 'pass', 'pass', 'fail'])).toEqual({
      text: '5회 만에 처음 실패',
      tone: 'fail',
    });
    expect(summarizeHistory(['fail', 'pass', 'fail'])).toEqual({
      text: '최근 3회 중 2회 실패',
      tone: 'fail',
    });
    expect(summarizeHistory(['pass', 'pass', 'pass'])).toEqual({
      text: '3회 연속 통과',
      tone: 'pass',
    });
    expect(summarizeHistory(['pass', 'fail', 'pass'])).toEqual({
      text: '직전 결과에서 복구',
      tone: 'pass',
    });
    expect(summarizeHistory(['blocked', 'blocked'])).toEqual({
      text: '최근 2회 중 2회 차단',
      tone: 'blocked',
    });
    expect(summarizeHistory(['fail'])).toBeNull();
  });
});

describe('runPeriodOf', () => {
  it('시작부터 마지막 기록까지 기간을 한국 시간으로 보여 준다', () => {
    const cases = [
      makeCase({ executedAt: new Date('2026-10-11T09:40:00Z') }),
      makeCase({ executedAt: new Date('2026-10-10T01:00:00Z') }),
    ];
    // 10.09 14:20 KST 시작, 10.11 18:40 KST 마지막 기록
    expect(runPeriodOf(new Date('2026-10-09T05:20:00Z'), cases)).toBe(
      '10.09 14:20 → 10.11 18:40 · 2일 4시간'
    );
    expect(runPeriodOf(new Date('2026-10-09T05:20:00Z'), [])).toBe('10.09 14:20 시작');
  });
});

describe('groupBlockedByReason', () => {
  it('차단만 사유별로 묶고, 많은 사유부터, 사유 미기록은 맨 뒤에 둔다', () => {
    const groups = groupBlockedByReason([
      makeCase({ status: 'blocked', comment: '해외 카드 없음', testSuiteName: '결제' }),
      makeCase({ status: 'blocked', comment: null }),
      makeCase({
        status: 'blocked',
        comment: ' 샌드박스 응답 없음 ',
        executedAt: new Date('2026-10-10T06:00:00Z'),
      }),
      makeCase({
        status: 'blocked',
        comment: '샌드박스 응답 없음',
        executedAt: new Date('2026-10-10T05:00:00Z'),
        testSuiteName: '결제',
      }),
      makeCase({ status: 'blocked', comment: '   ' }),
      makeCase({ status: 'fail', comment: '샌드박스 응답 없음' }),
    ]);
    expect(groups.map((g) => [g.reason, g.cases.length])).toEqual([
      ['샌드박스 응답 없음', 2],
      ['해외 카드 없음', 1],
      [null, 2],
    ]);
    expect(groups[0].suiteNames).toEqual(['인증', '결제']);
    expect(groups[0].firstRecordedAt).toEqual(new Date('2026-10-10T05:00:00Z'));
  });
});
