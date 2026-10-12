import type { TestCaseResultStatus } from '@/shared/types';
import { describe, expect, it } from 'vitest';

import { summarizeMilestoneProgress } from './progress';

describe('summarizeMilestoneProgress (#418)', () => {
  it('케이스마다 가장 최근 결과 하나로 세고, 결과가 없는 케이스는 미실행이다.', () => {
    const statuses = new Map<string, TestCaseResultStatus>([
      ['a', 'pass'],
      ['b', 'fail'],
      ['c', 'blocked'],
    ]);
    expect(summarizeMilestoneProgress(['a', 'b', 'c', 'd'], statuses)).toEqual({
      total: 4,
      pass: 1,
      fail: 1,
      blocked: 1,
      untested: 1,
      completed: 3,
      progressPercent: 75,
    });
  });

  it('같은 케이스가 직접 연결과 스위트로 겹쳐도 한 번만 센다.', () => {
    const statuses = new Map<string, TestCaseResultStatus>([['a', 'pass']]);
    expect(summarizeMilestoneProgress(['a', 'a', 'b'], statuses)).toMatchObject({
      total: 2,
      completed: 1,
      progressPercent: 50,
    });
  });

  it('범위 밖 케이스의 결과는 세지 않고, 케이스가 없으면 0% 다.', () => {
    const statuses = new Map<string, TestCaseResultStatus>([['x', 'pass']]);
    expect(summarizeMilestoneProgress([], statuses)).toMatchObject({
      total: 0,
      completed: 0,
      progressPercent: 0,
    });
  });
});
