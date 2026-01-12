import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createMockMilestoneRow,
  mockGetDatabase,
  resetMockDb,
  setMockUpdateReturn,
} from '@/shared/test/__mocks__/db';

vi.mock('@/shared/lib/db', () => ({
  getDatabase: () => mockGetDatabase,
  milestones: { id: 'id', deleted_at: 'deleted_at' },
}));

import { deleteMilestone } from './server-actions';

describe('deleteMilestone', () => {
  beforeEach(() => {
    resetMockDb();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('마일스톤을 삭제(Soft Delete)하면 삭제된 ID를 반환한다', async () => {
    const mockRow = createMockMilestoneRow({ archived_at: new Date() });
    setMockUpdateReturn(mockRow);

    const result = await deleteMilestone(mockRow.id);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(mockRow.id);
      expect(result.message).toBe('마일스톤이 삭제되었습니다.');
    }
  });

  it('삭제할 마일스톤이 존재하지 않으면 에러를 반환한다', async () => {
    setMockUpdateReturn(undefined);

    const result = await deleteMilestone('non-existent-id');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors._milestone).toContain('마일스톤 삭제에 실패했습니다.');
    }
  });
});