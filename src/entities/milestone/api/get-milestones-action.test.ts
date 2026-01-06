import {
  createMockMilestoneRow,
  mockGetDatabase,
  resetMockDb,
  setMockSelectReturn,
} from '@/shared/test/__mocks__/db';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getMilestoneById, getMilestones } from './server-actions';

vi.mock('@/shared/lib/db', () => ({
  getDatabase: () => mockGetDatabase,
  milestones: { id: 'id', project_id: 'project_id' },
}));

describe('getMilestones', () => {
  beforeEach(() => {
    resetMockDb();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('성공 케이스', () => {
    it('프로젝트의 마일스톤 목록을 반환한다', async () => {
      const mockRows = [
        createMockMilestoneRow({ id: 'milestone-1', name: '마일스톤 1' }),
        createMockMilestoneRow({ id: 'milestone-2', name: '마일스톤 2' }),
      ];
      setMockSelectReturn(mockRows);

      const result = await getMilestones({ projectId: 'project-123' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0].title).toBe('마일스톤 1');
        expect(result.data[1].title).toBe('마일스톤 2');
      }
    });

    it('마일스톤이 없으면 빈 배열을 반환한다', async () => {
      setMockSelectReturn([]);

      const result = await getMilestones({ projectId: 'project-123' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });
  });

  describe('실패 케이스', () => {
    it('DB 에러가 발생하면 에러를 반환한다', async () => {
      mockGetDatabase.mockImplementationOnce(() => {
        throw new Error('DB 연결 오류');
      });

      const result = await getMilestones({ projectId: 'project-123' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors._milestone).toContain(
          '마일스톤 목록을 불러오는 도중 오류가 발생했습니다.'
        );
      }
    });
  });
});

describe('getMilestoneById', () => {
  beforeEach(() => {
    resetMockDb();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('성공 케이스', () => {
    it('ID로 마일스톤을 조회하면 해당 마일스톤을 반환한다', async () => {
      const mockRow = createMockMilestoneRow({ id: 'milestone-123', name: '테스트 마일스톤' });
      setMockSelectReturn([mockRow]);

      const result = await getMilestoneById('milestone-123');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('milestone-123');
        expect(result.data.title).toBe('테스트 마일스톤');
      }
    });
  });

  describe('실패 케이스', () => {
    it('존재하지 않는 ID로 조회하면 에러를 반환한다', async () => {
      setMockSelectReturn([]);

      const result = await getMilestoneById('non-existent-id');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors._milestone).toContain('해당 마일스톤이 존재하지 않습니다.');
      }
    });

    it('DB 에러가 발생하면 에러를 반환한다', async () => {
      mockGetDatabase.mockImplementationOnce(() => {
        throw new Error('DB 연결 오류');
      });

      const result = await getMilestoneById('milestone-123');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors._milestone).toContain('마일스톤을 불러오는 도중 오류가 발생했습니다.');
      }
    });
  });
});
