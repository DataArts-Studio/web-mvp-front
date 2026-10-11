import { describe, expect, it, vi } from 'vitest';

import { addCasesToRunScope, deriveTestRunStatus } from './run-scope';

vi.mock('server-only', () => ({}));
vi.mock('uuid', () => ({ v7: vi.fn(() => 'new-case-run') }));

describe('deriveTestRunStatus', () => {
  it.each([
    [[], 'NOT_STARTED'],
    [['untested', 'untested'], 'NOT_STARTED'],
    [['pass', 'untested'], 'IN_PROGRESS'],
    [['pass', 'fail', 'blocked'], 'COMPLETED'],
  ])('%j 이면 %s', (statuses, expected) => {
    expect(deriveTestRunStatus(statuses)).toBe(expected);
  });
});

describe('addCasesToRunScope', () => {
  const setup = (restoredIds: string[], existingIds: string[]) => {
    const values = vi.fn(async () => undefined);
    const db = {
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn(async () => restoredIds.map((caseId) => ({ caseId }))),
          })),
        })),
      })),
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(async () => existingIds.map((id) => ({ test_case_id: id }))),
        })),
      })),
      insert: vi.fn(() => ({ values })),
    };
    return { db, values };
  };

  it('제외됐던 케이스는 되살리고 처음 들어오는 케이스만 새로 만든다 (#375)', async () => {
    // case-1 은 예전에 제외된 행이 있어 복원되고, case-2 는 실행에 처음 들어온다.
    const { db, values } = setup(['case-1'], ['case-1']);

    const count = await addCasesToRunScope(db as never, 'run-1', [
      { caseId: 'case-1', sourceType: 'suite', sourceId: 'suite-1' },
      { caseId: 'case-2', sourceType: 'suite', sourceId: 'suite-1' },
    ]);

    expect(count).toBe(2);
    expect(values).toHaveBeenCalledWith([
      expect.objectContaining({
        test_run_id: 'run-1',
        test_case_id: 'case-2',
        status: 'untested',
        source_type: 'suite',
        source_id: 'suite-1',
      }),
    ]);
  });

  it('이미 실행에 있는 케이스는 다시 만들지 않는다', async () => {
    const { db } = setup([], ['case-1']);

    const count = await addCasesToRunScope(db as never, 'run-1', [
      { caseId: 'case-1', sourceType: 'adhoc', sourceId: null },
    ]);

    expect(count).toBe(0);
    expect(db.insert).not.toHaveBeenCalled();
  });
});
