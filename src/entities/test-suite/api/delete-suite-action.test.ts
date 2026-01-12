import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createMockTestSuiteRow,
  mockGetDatabase,
  resetMockDb,
  setMockUpdateReturn,
} from '@/shared/test/__mocks__/db';

// DB 모듈 모킹
vi.mock('@/shared/lib/db', () => ({
  getDatabase: mockGetDatabase,
  testSuite: { id: 'id', project_id: 'project_id', name: 'name' },
}));

import { deleteTestSuite } from './server-actions';

describe('deleteTestSuite', () => {
  beforeEach(() => {
    resetMockDb();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('성공 케이스', () => {
    it('테스트 스위트를 soft delete 한다', async () => {
      const mockRow = createMockTestSuiteRow({
        id: 'suite-123',
        archived_at: new Date(),
      });
      setMockUpdateReturn(mockRow);

      const result = await deleteTestSuite('suite-123');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('suite-123');
        expect(result.message).toBe('테스트 스위트를 삭제하였습니다.');
      }
    });

    it('삭제된 스위트의 ID를 반환한다', async () => {
      const mockRow = createMockTestSuiteRow({ id: 'deleted-suite-id' });
      setMockUpdateReturn(mockRow);

      const result = await deleteTestSuite('deleted-suite-id');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ id: 'deleted-suite-id' });
      }
    });
  });

  describe('실패 케이스', () => {
    it('존재하지 않는 ID로 삭제하면 에러를 반환한다', async () => {
      setMockUpdateReturn(undefined);

      const result = await deleteTestSuite('non-existent-id');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors._testSuite).toContain('테스트 스위트를 찾을 수 없습니다.');
      }
    });

    it('DB 에러가 발생하면 에러를 반환한다', async () => {
      mockGetDatabase.mockImplementationOnce(() => {
        throw new Error('DB 연결 오류');
      });

      const result = await deleteTestSuite('suite-123');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors._testSuite).toContain('테스트 스위트를 삭제하는 도중 오류가 발생했습니다.');
      }
    });
  });
});
