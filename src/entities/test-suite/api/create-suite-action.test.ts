import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createMockCreateTestSuiteInput,
  createMockTestSuiteRow,
  mockGetDatabase,
  resetMockDb,
  setMockInsertReturn,
} from '@/shared/test/__mocks__/db';

// DB 모듈 모킹
vi.mock('@/shared/lib/db', () => ({
  getDatabase: mockGetDatabase,
  testSuite: { id: 'id', project_id: 'project_id', name: 'name' },
}));

// uuid 모킹
vi.mock('uuid', () => ({
  v7: () => '01234567-89ab-cdef-0123-456789abcdef',
}));

import { createTestSuite } from './server-actions';

describe('createTestSuite', () => {
  beforeEach(() => {
    resetMockDb();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('성공 케이스', () => {
    it('유효한 입력으로 테스트 스위트를 생성하면 성공 결과를 반환한다', async () => {
      const input = createMockCreateTestSuiteInput();
      const mockRow = createMockTestSuiteRow();
      setMockInsertReturn(mockRow);

      const result = await createTestSuite(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          id: mockRow.id,
          projectId: mockRow.project_id,
          title: mockRow.name,
          description: mockRow.description,
          sortOrder: mockRow.sort_order,
          createdAt: mockRow.created_at,
          updatedAt: mockRow.updated_at,
          deletedAt: mockRow.deleted_at,
        });
        expect(result.message).toBe('테스트 스위트를 생성하였습니다.');
      }
    });

    it('description이 없어도 테스트 스위트를 생성할 수 있다', async () => {
      const input = createMockCreateTestSuiteInput({ description: undefined });
      const mockRow = createMockTestSuiteRow({ description: null });
      setMockInsertReturn(mockRow);

      const result = await createTestSuite(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBeUndefined();
      }
    });

    it('sortOrder가 지정되지 않으면 기본값 0이 사용된다', async () => {
      const input = createMockCreateTestSuiteInput({ sortOrder: undefined });
      const mockRow = createMockTestSuiteRow({ sort_order: 0 });
      setMockInsertReturn(mockRow);

      const result = await createTestSuite(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sortOrder).toBe(0);
      }
    });
  });

  describe('실패 케이스', () => {
    it('DB insert가 실패하면 에러를 반환한다', async () => {
      const input = createMockCreateTestSuiteInput();
      setMockInsertReturn(undefined);

      const result = await createTestSuite(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors._testSuite).toContain('테스트 스위트를 생성하는 도중 오류가 발생했습니다.');
      }
    });

    it('DB 에러가 발생하면 에러를 반환한다', async () => {
      const input = createMockCreateTestSuiteInput();
      mockGetDatabase.mockImplementationOnce(() => {
        throw new Error('DB 연결 오류');
      });

      const result = await createTestSuite(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors._testSuite).toContain('테스트 스위트를 생성하는 도중 오류가 발생했습니다.');
      }
    });
  });
});
