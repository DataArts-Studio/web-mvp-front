import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createMockTestSuiteRow,
  mockGetDatabase,
  resetMockDb,
  setMockSelectReturn,
} from '@/shared/test/__mocks__/db';

// DB 모듈 모킹
vi.mock('@/shared/lib/db', () => ({
  getDatabase: mockGetDatabase,
  testSuite: { id: 'id', project_id: 'project_id', name: 'name' },
}));

import { getTestSuiteById } from './server-actions';

describe('getTestSuiteById', () => {
  beforeEach(() => {
    resetMockDb();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('성공 케이스', () => {
    it('ID로 테스트 스위트를 조회한다', async () => {
      const mockRow = createMockTestSuiteRow({ id: 'suite-123' });
      setMockSelectReturn([mockRow]);

      const result = await getTestSuiteById('suite-123');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('suite-123');
      }
    });

    it('반환된 데이터가 올바른 형식으로 변환된다', async () => {
      const mockRow = createMockTestSuiteRow({
        id: 'test-id',
        project_id: 'project-456',
        name: '스위트 제목입니다요',
        description: '상세 설명',
        sort_order: 10,
        created_at: new Date('2024-02-01'),
        updated_at: new Date('2024-02-02'),
        deleted_at: null,
      });
      setMockSelectReturn([mockRow]);

      const result = await getTestSuiteById('test-id');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          id: 'test-id',
          projectId: 'project-456',
          title: '스위트 제목입니다요',
          description: '상세 설명',
          sortOrder: 10,
          createdAt: new Date('2024-02-01'),
          updatedAt: new Date('2024-02-02'),
          deletedAt: null,
        });
      }
    });

    it('description이 null인 경우 undefined로 변환된다', async () => {
      const mockRow = createMockTestSuiteRow({ description: null });
      setMockSelectReturn([mockRow]);

      const result = await getTestSuiteById('suite-123');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBeUndefined();
      }
    });
  });

  describe('실패 케이스', () => {
    it('존재하지 않는 ID로 조회하면 에러를 반환한다', async () => {
      setMockSelectReturn([]);

      const result = await getTestSuiteById('non-existent-id');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors._testSuite).toContain('테스트 스위트를 찾을 수 없습니다.');
      }
    });

    it('DB 에러가 발생하면 에러를 반환한다', async () => {
      mockGetDatabase.mockImplementationOnce(() => {
        throw new Error('DB 연결 오류');
      });

      const result = await getTestSuiteById('suite-123');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors._testSuite).toContain('테스트 스위트를 불러오는 도중 오류가 발생했습니다.');
      }
    });
  });
});
