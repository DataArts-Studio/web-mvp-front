import type { TestSuiteCard } from '@/entities/test-suite';
import { describe, expect, it } from 'vitest';

import { pickWatchCases, summarizeSuiteRuns, watchReasonOf } from './suite-detail-model';

type RecentRun = TestSuiteCard['recentRuns'][number];

const run = (passed: number, failed: number, blocked = 0, total = passed + failed + blocked) =>
  ({
    runId: `r-${passed}-${failed}-${Math.random()}`,
    name: 'run',
    runAt: new Date('2026-10-01'),
    status: failed > 0 ? 'failed' : 'passed',
    passed,
    failed,
    blocked,
    total,
  }) as RecentRun;

describe('summarizeSuiteRuns', () => {
  it('마지막·직전 통과율과 실패한 회차를 센다 (최근 것부터 온다)', () => {
    const summary = summarizeSuiteRuns([
      run(63, 37),
      run(74, 26),
      run(100, 0),
      run(90, 10),
      run(100, 0),
      run(100, 0),
      run(80, 20),
    ]);
    expect(summary.lastRate).toBe(63);
    expect(summary.prevRate).toBe(74);
    expect(summary.failedRuns).toBe(4);
    expect(summary.totalRuns).toBe(7);
    expect(summary.recentFailedRuns).toBe(3);
    expect(summary.recentWindow).toBe(6);
  });

  it('실행이 없으면 비어 있다', () => {
    const summary = summarizeSuiteRuns([]);
    expect(summary.lastRate).toBeNull();
    expect(summary.lastRun).toBeNull();
    expect(summary.recentWindow).toBe(0);
  });
});

describe('watchReasonOf', () => {
  it('직전 통과 뒤 실패는 새 실패', () => {
    expect(watchReasonOf(['pass', 'pass', 'fail'])).toEqual({ kind: 'newFail' });
  });

  it('연속 실패는 계속 실패와 연속 횟수', () => {
    expect(watchReasonOf(['pass', 'fail', 'fail', 'fail'])).toEqual({
      kind: 'stillFailing',
      streak: 3,
    });
  });

  it('통과와 실패가 섞이고 실패가 2번 이상이면 흔들림', () => {
    expect(watchReasonOf(['fail', 'pass', 'fail', 'pass', 'pass'])).toEqual({
      kind: 'flaky',
      fails: 2,
      total: 5,
    });
  });

  it('최근 5회 연속 통과면 자동화 후보, 미실행 결과는 건너뛴다', () => {
    expect(watchReasonOf(['pass', 'pass', 'untested', 'pass', 'pass', 'pass'])).toEqual({
      kind: 'automation',
      streak: 5,
    });
    expect(watchReasonOf(['pass', 'pass'])).toBeNull();
    expect(watchReasonOf([])).toBeNull();
  });
});

describe('pickWatchCases', () => {
  it('이유 순서대로 최대 3개', () => {
    const picked = pickWatchCases([
      { id: 'auto', recentResults: ['pass', 'pass', 'pass', 'pass', 'pass'] },
      { id: 'flaky', recentResults: ['fail', 'pass', 'fail', 'pass'] },
      { id: 'quiet', recentResults: ['pass'] },
      { id: 'new', recentResults: ['pass', 'fail'] },
      { id: 'still', recentResults: ['fail', 'fail'] },
    ]);
    expect(picked.map((item) => item.testCase.id)).toEqual(['new', 'still', 'flaky']);
  });
});
