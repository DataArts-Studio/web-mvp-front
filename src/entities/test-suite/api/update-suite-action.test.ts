import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createMockTestSuiteRow,
  mockGetDatabase,
  resetMockDb,
  setMockUpdateReturn,
} from '@/shared/test/__mocks__/db';

// DB 모듈 모킹
vi.mock('@/shared/lib/db', () => ({
  getDatabase: () => mockGetDatabase(),
  testSuite: { id: 'id', project_id: 'project_id', name: 'name' },
}));

import { updateTestSuite } from './server-actions';

describe('updateTestSuite', () => {
  beforeEach(() => {
    resetMockDb();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('성공 케이스', () => {
    it('제목을 수정할 수 있다', async () => {
      const mockRow = createMockTestSuiteRow({
        id: 'suite-123',
        name: '수정된 제목입니다요',
      });
      setMockUpdateReturn(mockRow);

      const result = await updateTestSuite({
        id: 'suite-123',
        title: '수정된 제목입니다요',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('수정된 제목입니다요');
        expect(result.message).toBe('테스트 스위트를 수정하였습니다.');
      }
    });

    it('설명을 수정할 수 있다', async () => {
      const mockRow = createMockTestSuiteRow({
        id: 'suite-123',
        description: '수정된 설명',
      });
      setMockUpdateReturn(mockRow);

      const result = await updateTestSuite({
        id: 'suite-123',
        description: '수정된 설명',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe('수정된 설명');
      }
    });

    it('정렬 순서를 수정할 수 있다', async () => {
      const mockRow = createMockTestSuiteRow({
        id: 'suite-123',
        sort_order: 99,
      });
      setMockUpdateReturn(mockRow);

      const result = await updateTestSuite({
        id: 'suite-123',
        sortOrder: 99,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sortOrder).toBe(99);
      }
    });

    it('여러 필드를 한번에 수정할 수 있다', async () => {
      const mockRow = createMockTestSuiteRow({
        id: 'suite-123',
        name: '새 제목입니다요요',
        description: '새 설명',
        sort_order: 50,
      });
      setMockUpdateReturn(mockRow);

      const result = await updateTestSuite({
        id: 'suite-123',
        title: '새 제목입니다요요',
        description: '새 설명',
        sortOrder: 50,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('새 제목입니다요요');
        expect(result.data.description).toBe('새 설명');
        expect(result.data.sortOrder).toBe(50);
      }
    });

    it('반환된 데이터가 올바른 형식으로 변환된다', async () => {
      const mockRow = createMockTestSuiteRow({
        id: 'test-id',
        project_id: 'project-789',
        name: '업데이트된 스위트입니다',
        description: '업데이트된 설명',
        sort_order: 15,
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-03-01'),
        deleted_at: null,
      });
      setMockUpdateReturn(mockRow);

      const result = await updateTestSuite({
        id: 'test-id',
        title: '업데이트된 스위트입니다',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          id: 'test-id',
          projectId: 'project-789',
          title: '업데이트된 스위트입니다',
          description: '업데이트된 설명',
          sortOrder: 15,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-03-01'),
          deletedAt: null,
        });
      }
    });
  });

  describe('실패 케이스', () => {
    it('존재하지 않는 ID로 수정하면 에러를 반환한다', async () => {
      setMockUpdateReturn(undefined);

      const result = await updateTestSuite({
        id: 'non-existent-id',
        title: '새 제목입니다요요',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors._testSuite).toContain('테스트 스위트를 찾을 수 없습니다.');
      }
    });

    it('DB 에러가 발생하면 에러를 반환한다', async () => {
      mockGetDatabase.mockImplementationOnce(() => {
        throw new Error('DB 연결 오류');
      });

      const result = await updateTestSuite({
        id: 'suite-123',
        title: '새 제목입니다요요',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors._testSuite).toContain('테스트 스위트를 수정하는 도중 오류가 발생했습니다.');
      }
    });
  });
});
