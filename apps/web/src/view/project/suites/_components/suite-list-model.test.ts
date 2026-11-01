import type { TestSuiteCard } from '@/entities/test-suite';
import { describe, expect, it } from 'vitest';

import { historySlotsOf, lastPassRateOf, sortSuites, suiteHealthOf } from './suite-list-model';

const makeSuite = (overrides: Partial<TestSuiteCard> & { id: string }): TestSuiteCard => ({
  projectId: 'p',
  title: overrides.id,
  sortOrder: 0,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  archivedAt: null,
  lifecycleStatus: 'ACTIVE',
  lastExecutedAt: null,
  tag: { label: '기본', tone: 'neutral' },
  includedPaths: [],
  caseCount: 3,
  executionHistoryCount: 0,
  recentRuns: [],
  ...overrides,
});

const lastRun = (passed: number, failed: number, blocked: number, runAt = '2026-10-01') => ({
  runId: `r-${runAt}`,
  runAt: new Date(runAt),
  status: 'passed' as const,
  counts: { passed, failed, blocked, skipped: 0 },
  total: passed + failed + blocked,
});

describe('suiteHealthOf · lastPassRateOf', () => {
  it('마지막 실행에 실패나 차단이 있으면 이슈, 모두 통과면 정상, 기록이 없으면 이력 없음', () => {
    expect(suiteHealthOf(makeSuite({ id: 'a', lastRun: lastRun(3, 1, 0) }))).toBe('issue');
    expect(suiteHealthOf(makeSuite({ id: 'b', lastRun: lastRun(3, 0, 1) }))).toBe('issue');
    expect(suiteHealthOf(makeSuite({ id: 'c', lastRun: lastRun(4, 0, 0) }))).toBe('ok');
    expect(suiteHealthOf(makeSuite({ id: 'd' }))).toBe('none');
    // 실행은 있지만 아직 아무 결과도 기록하지 않았으면 이력 없음으로 본다
    const untouched = {
      ...lastRun(0, 0, 0),
      counts: { passed: 0, failed: 0, blocked: 0, skipped: 4 },
      total: 4,
    };
    expect(suiteHealthOf(makeSuite({ id: 'e', lastRun: untouched }))).toBe('none');
    expect(lastPassRateOf(makeSuite({ id: 'e', lastRun: untouched }))).toBeNull();
    expect(lastPassRateOf(makeSuite({ id: 'a', lastRun: lastRun(3, 1, 0) }))).toBe(75);
    expect(lastPassRateOf(makeSuite({ id: 'd' }))).toBeNull();
  });
});

describe('sortSuites', () => {
  const suites = [
    makeSuite({ id: 'old', lastExecutedAt: new Date('2026-09-01'), lastRun: lastRun(1, 1, 0) }),
    makeSuite({ id: 'never' }),
    makeSuite({ id: 'new', lastExecutedAt: new Date('2026-10-10'), lastRun: lastRun(9, 1, 0) }),
  ];

  it('최근 실행 순으로 정렬하고 기록 없는 스위트는 맨 뒤에 둔다', () => {
    expect(sortSuites(suites, 'recent').map((s) => s.id)).toEqual(['new', 'old', 'never']);
  });

  it('통과율 낮은 순으로 정렬한다', () => {
    expect(sortSuites(suites, 'passRate').map((s) => s.id)).toEqual(['old', 'new', 'never']);
  });
});

describe('historySlotsOf', () => {
  it('최근 실행을 오래된 것부터 오른쪽으로 놓고 모자란 앞칸을 비운다', () => {
    const runs = ['r3', 'r2', 'r1'].map((runId) => ({
      runId,
      runAt: new Date(),
      status: 'passed' as const,
      passed: 1,
      failed: 0,
      blocked: 0,
      total: 1,
    }));
    const slots = historySlotsOf(runs, 5);
    expect(slots.map((s) => s?.runId ?? null)).toEqual([null, null, 'r1', 'r2', 'r3']);
  });
});
