import { requireProjectAccess } from '@/access/lib/require-access';
import { getDatabase } from '@testea/db';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { bulkUpdateTestCaseRunStatus } from './bulk-update-test-case-runs';

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
const db = {
  select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit })) })) })),
  update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => ({ returning })) })) })),
  transaction: vi.fn(async (fn: (tx: unknown) => unknown) => fn(db)),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getDatabase).mockReturnValue(db as unknown as ReturnType<typeof getDatabase>);
  vi.mocked(requireProjectAccess).mockResolvedValue(true);
  returning.mockResolvedValue([{ id: CASE_RUN_ID }]);
});

describe('삭제된 실행의 일괄 결과 변경 (#419)', () => {
  it('실행이 삭제(ARCHIVED)됐으면 일괄 변경하지 않는다.', async () => {
    limit
      .mockResolvedValueOnce([{ testRunId: RUN_ID }])
      .mockResolvedValueOnce([{ projectId: 'project-1', lifecycleStatus: 'ARCHIVED' }]);

    const result = await bulkUpdateTestCaseRunStatus({
      testCaseRunIds: [CASE_RUN_ID],
      status: 'fail',
    });

    expect(result).toEqual({
      success: false,
      errors: { _general: ['삭제된 테스트 실행은 결과를 바꿀 수 없습니다.'] },
    });
    expect(db.update).not.toHaveBeenCalled();
  });

  it('활성 실행이면 일괄 변경한다.', async () => {
    limit
      .mockResolvedValueOnce([{ testRunId: RUN_ID }])
      .mockResolvedValueOnce([{ projectId: 'project-1', lifecycleStatus: 'ACTIVE' }]);

    const result = await bulkUpdateTestCaseRunStatus({
      testCaseRunIds: [CASE_RUN_ID],
      status: 'fail',
    });

    expect(result).toEqual({ success: true, data: { updatedCount: 1 } });
  });
});
