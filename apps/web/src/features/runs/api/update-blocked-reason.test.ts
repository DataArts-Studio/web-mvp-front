import { requireProjectAccess } from '@/access/lib/require-access';
import { getDatabase } from '@testea/db';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { updateBlockedReason } from './update-blocked-reason';

vi.mock('@/access/lib/require-access', () => ({ requireProjectAccess: vi.fn() }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/shared/lib/cache/tags', () => ({ INVALIDATE: { runs: [] }, invalidateCache: vi.fn() }));
vi.mock('@testea/db', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@testea/db')>()),
  getDatabase: vi.fn(),
}));

const PROJECT_A = '00000000-0000-4000-8000-000000000001';
const RUN_ID = '00000000-0000-4000-8000-000000000003';
const CASE_RUN_ID = '00000000-0000-4000-8000-000000000005';
const limit = vi.fn();
const returning = vi.fn();
const set = vi.fn(() => ({ where: vi.fn(() => ({ returning })) }));
const db = {
  select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit })) })) })),
  update: vi.fn(() => ({ set })),
};

const input = { testRunId: RUN_ID, testCaseRunIds: [CASE_RUN_ID], reason: '  샌드박스 응답 없음 ' };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getDatabase).mockReturnValue(db as unknown as ReturnType<typeof getDatabase>);
  vi.mocked(requireProjectAccess).mockResolvedValue(true);
  limit.mockResolvedValue([{ projectId: PROJECT_A, lifecycleStatus: 'ACTIVE' }]);
  returning.mockResolvedValue([{ id: CASE_RUN_ID }]);
});

describe('updateBlockedReason', () => {
  it('권한이 없으면 사유를 바꾸지 않는다.', async () => {
    vi.mocked(requireProjectAccess).mockResolvedValue(false);
    expect((await updateBlockedReason(input)).success).toBe(false);
    expect(db.update).not.toHaveBeenCalled();
  });

  it('빈 사유나 형식이 틀린 ID 는 DB 를 건드리지 않고 거부한다.', async () => {
    expect((await updateBlockedReason({ ...input, reason: '   ' })).success).toBe(false);
    expect((await updateBlockedReason({ ...input, testCaseRunIds: ['x'] })).success).toBe(false);
    expect((await updateBlockedReason({ ...input, testCaseRunIds: [] })).success).toBe(false);
    expect(db.select).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
  });

  it('삭제된 실행은 사유를 바꾸지 않는다.', async () => {
    limit.mockResolvedValue([{ projectId: PROJECT_A, lifecycleStatus: 'ARCHIVED' }]);
    expect((await updateBlockedReason(input)).success).toBe(false);
    expect(db.update).not.toHaveBeenCalled();
  });

  it('앞뒤 공백을 지운 사유로 저장하고 바뀐 건수를 돌려준다.', async () => {
    expect(await updateBlockedReason(input)).toEqual({ success: true, data: { updatedCount: 1 } });
    expect(set).toHaveBeenCalledWith(expect.objectContaining({ comment: '샌드박스 응답 없음' }));
  });
});
