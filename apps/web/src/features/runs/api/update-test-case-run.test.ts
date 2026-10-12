import { requireProjectAccess } from '@/access/lib/require-access';
import { getDatabase } from '@testea/db';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { updateTestCaseRunStatus } from './update-test-case-run';

vi.mock('@/access/lib/require-access', () => ({ requireProjectAccess: vi.fn() }));
vi.mock('@/shared/lib/cache/tags', () => ({ INVALIDATE: {}, invalidateCache: vi.fn() }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@testea/db', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@testea/db')>()),
  getDatabase: vi.fn(),
}));
vi.mock('@/entities/test-run/api/run-scope', () => ({ recomputeTestRunStatus: vi.fn() }));

const CASE_RUN_ID = '00000000-0000-4000-8000-000000000001';
const RUN_ID = '00000000-0000-4000-8000-000000000002';
const limit = vi.fn();
const returning = vi.fn();
const set = vi.fn();
const db = {
  select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit })) })) })),
  update: vi.fn(() => ({ set })),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getDatabase).mockReturnValue(db as unknown as ReturnType<typeof getDatabase>);
  vi.mocked(requireProjectAccess).mockResolvedValue(true);
  set.mockImplementation(() => ({ where: vi.fn(() => ({ returning })) }));
  limit
    .mockResolvedValueOnce([{ testRunId: RUN_ID }])
    .mockResolvedValueOnce([{ projectId: 'project-1' }]);
  returning.mockResolvedValue([
    { id: CASE_RUN_ID, test_run_id: RUN_ID, status: 'fail', comment: '기존', executed_at: null },
  ]);
});

describe('케이스 실행 상태 변경의 코멘트 처리 (#413)', () => {
  it('코멘트를 보내지 않으면 저장된 코멘트를 건드리지 않는다.', async () => {
    await updateTestCaseRunStatus({ testCaseRunId: CASE_RUN_ID, status: 'fail' });
    expect(set.mock.calls[0][0]).not.toHaveProperty('comment');
  });

  it('코멘트를 보내면 그 값으로 저장하고, null 이면 비운다.', async () => {
    await updateTestCaseRunStatus({ testCaseRunId: CASE_RUN_ID, status: 'pass', comment: '메모' });
    expect(set.mock.calls[0][0]).toHaveProperty('comment', '메모');

    limit
      .mockResolvedValueOnce([{ testRunId: RUN_ID }])
      .mockResolvedValueOnce([{ projectId: 'project-1' }]);
    await updateTestCaseRunStatus({ testCaseRunId: CASE_RUN_ID, status: 'pass', comment: null });
    expect(set.mock.calls[1][0]).toHaveProperty('comment', null);
  });
});
