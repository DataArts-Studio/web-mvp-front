import {
  createMockMilestoneRow,
  mockGetDatabase,
  resetMockDb,
  setMockSelectReturn,
  setMockUpdateReturn,
} from '@/shared/test/__mocks__/db';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { deleteMilestone } from './server-actions';

vi.mock('@testea/db', () => ({
  getDatabase: mockGetDatabase,
  milestones: { id: 'id', archived_at: 'archived_at', lifecycle_status: 'lifecycle_status' },
}));

describe('deleteMilestone', () => {
  beforeEach(() => {
    resetMockDb();
    // 인가 프리플라이트 조회(대상 소유 프로젝트 확인)용 기본 반환
    setMockSelectReturn([{ projectId: 'project-123', project_id: 'project-123' }]);
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
      expect(result.message).toBe('마일스톤이 휴지통으로 이동되었습니다.');
    }
  });

  it('삭제할 마일스톤이 존재하지 않으면 에러를 반환한다', async () => {
    setMockUpdateReturn(undefined);

    const result = await deleteMilestone('non-existent-id');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors._milestone).toContain('마일스톤을 찾을 수 없습니다.');
    }
  });
});
