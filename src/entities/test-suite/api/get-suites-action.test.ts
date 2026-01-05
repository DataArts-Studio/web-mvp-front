import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createMockTestSuiteRow,
  mockGetDatabase,
  resetMockDb,
  setMockSelectReturn,
} from '@/shared/test/__mocks__/db';

// DB 모듈 모킹
vi.mock('@/shared/lib/db', () => ({
  getDatabase: () => mockGetDatabase(),
  testSuite: { id: 'id', project_id: 'project_id', name: 'name' },
}));

import { getTestSuites } from './server-actions';

describe('getTestSuites', () => {
  beforeEach(() => {
    resetMockDb();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('성공 케이스', () => {
    it('프로젝트 ID로 테스트 스위트 목록을 조회한다', async () => {
      const mockRows = [
        createMockTestSuiteRow({ id: 'suite-1', name: '스위트 1입니다 제목' }),
        createMockTestSuiteRow({ id: 'suite-2', name: '스위트 2입니다 제목' }),
      ];
      setMockSelectReturn(mockRows);

      const result = await getTestSuites({ projectId: 'project-123' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0].id).toBe('suite-1');
        expect(result.data[1].id).toBe('suite-2');
      }
    });

    it('빈 목록도 성공으로 반환한다', async () => {
      setMockSelectReturn([]);

      const result = await getTestSuites({ projectId: 'project-123' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });

    it('페이지네이션 파라미터가 적용된다', async () => {
      const mockRows = [createMockTestSuiteRow()];
      setMockSelectReturn(mockRows);

      const result = await getTestSuites({
        projectId: 'project-123',
        limits: { offset: 10, limit: 5 },
      });

      expect(result.success).toBe(true);
    });

    it('기본 페이지네이션 값이 적용된다 (offset: 0, limit: 10)', async () => {
      const mockRows = [createMockTestSuiteRow()];
      setMockSelectReturn(mockRows);

      const result = await getTestSuites({ projectId: 'project-123' });

      expect(result.success).toBe(true);
    });

    it('반환된 데이터가 올바른 형식으로 변환된다', async () => {
      const mockRow = createMockTestSuiteRow({
        id: 'test-id',
        project_id: 'project-123',
        name: '테스트 스위트 이름입니다',
        description: '설명입니다',
        sort_order: 5,
        created_at: new Date('2024-01-15'),
        updated_at: new Date('2024-01-16'),
        deleted_at: null,
      });
      setMockSelectReturn([mockRow]);

      const result = await getTestSuites({ projectId: 'project-123' });

      expect(result.success).toBe(true);
      if (result.success) {
        const suite = result.data[0];
        expect(suite.id).toBe('test-id');
        expect(suite.projectId).toBe('project-123');
        expect(suite.title).toBe('테스트 스위트 이름입니다');
        expect(suite.description).toBe('설명입니다');
        expect(suite.sortOrder).toBe(5);
        expect(suite.createdAt).toEqual(new Date('2024-01-15'));
        expect(suite.updatedAt).toEqual(new Date('2024-01-16'));
        expect(suite.deletedAt).toBeNull();
      }
    });
  });

  describe('실패 케이스', () => {
    it('DB 에러가 발생하면 에러를 반환한다', async () => {
      mockGetDatabase.mockImplementationOnce(() => {
        throw new Error('DB 연결 오류');
      });

      const result = await getTestSuites({ projectId: 'project-123' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors._testSuite).toContain('테스트 스위트를 불러오는 도중 오류가 발생했습니다.');
      }
    });
  });
});
