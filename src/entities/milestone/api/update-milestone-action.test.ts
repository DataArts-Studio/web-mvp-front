import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createMockMilestoneRow,
  mockDb,
  mockGetDatabase,
  resetMockDb,
  setMockUpdateReturn,
} from '@/shared/test/__mocks__/db';

vi.mock('@/shared/lib/db', () => ({
  getDatabase: mockGetDatabase,
  milestones: { id: 'id', name: 'name' },
}));

import { updateMilestone } from './server-actions';

describe('updateMilestone', () => {
  beforeEach(() => {
    resetMockDb();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('마일스톤 정보를 수정하면 업데이트된 데이터를 반환한다', async () => {
    const mockRow = createMockMilestoneRow({ name: 'Updated Milestone' });
    setMockUpdateReturn(mockRow);

    const result = await updateMilestone(mockRow.id, { title: 'Updated Milestone' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('Updated Milestone');
      expect(result.message).toBe('마일스톤이 수정되었습니다.');
    }
  });

  it('수정할 마일스톤이 존재하지 않으면 에러를 반환한다', async () => {
    setMockUpdateReturn(undefined);

    const result = await updateMilestone('non-existent-id', { title: 'New Name' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors._milestone).toContain('마일스톤 수정에 실패했습니다.');
    }
  });

  it('DB 에러 발생 시 에러 메시지를 반환한다', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockDb.update.mockImplementationOnce(() => {
      throw new Error('DB Error');
    });

    const result = await updateMilestone('any-id', { title: 'New Name' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors._milestone).toContain('마일스톤을 수정하는 도중 오류가 발생했습니다.');
    }
    consoleErrorSpy.mockRestore();
  });
});