import { createMockCreateMilestoneInput, createMockMilestoneRow, mockGetDatabase, resetMockDb, setMockInsertReturn } from '@/shared/test/__mocks__/db';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createMilestone } from './server-actions';

// DB 모듈 모킹
vi.mock('@/shared/lib/db', () => ({
  getDatabase: () => (mockGetDatabase as any)(),
  milestones: { id: 'id', project_id: 'project_id', name: 'name' },
}));

// uuid 모킹
vi.mock('uuid', () => ({
  v7: () => '01234567-89ab-cdef-0123-456789abcdef',
}));



const MOCK_DATE = new Date('2024-01-15T12:00:00.000Z');

describe('createMilestone', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_DATE);
    resetMockDb();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('성공 케이스', () => {
    it('유효한 입력으로 마일스톤을 생성하면 성공 결과를 반환한다', async () => {
      const input = createMockCreateMilestoneInput();
      const mockRow = createMockMilestoneRow();
      setMockInsertReturn(mockRow);

      const result = await createMilestone(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          id: mockRow.id,
          projectId: mockRow.project_id,
          title: mockRow.name,
          description: mockRow.description,
          startDate: mockRow.start_date,
          endDate: mockRow.end_date,
          status: mockRow.progress_status,
          createdAt: mockRow.created_at,
          updatedAt: mockRow.updated_at,
          archivedAt: mockRow.archived_at,
          lifecycleStatus: mockRow.lifecycle_status,
        });
        expect(result.message).toBe('마일스톤을 생성하였습니다.');
      }
    });
  });

  describe('실패 케이스', () => {
    it('DB insert가 실패하면 에러를 반환한다', async () => {
      const input = createMockCreateMilestoneInput();
      setMockInsertReturn(undefined);

      const result = await createMilestone(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors._milestone).toContain('마일스톤을 생성하는 도중 오류가 발생했습니다.');
      }
    });

    it('DB 에러가 발생하면 에러를 반환한다', async () => {
      const input = createMockCreateMilestoneInput();
      mockGetDatabase.mockImplementationOnce(() => {
        throw new Error('DB 연결 오류');
      });

      const result = await createMilestone(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors._milestone).toContain('마일스톤을 생성하는 도중 오류가 발생했습니다.');
      }
    });
  });
});