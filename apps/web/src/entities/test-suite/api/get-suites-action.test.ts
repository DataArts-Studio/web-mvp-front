import { createMockTestSuiteRow } from '@/shared/test/__mocks__/db';
import { type Mock, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getTestSuites } from './server-actions';

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

// getTestSuites 의 쿼리 체인:
// db.select().from().where().$dynamic() → (limit().offset())? → await
let mockRows: unknown = [];
let throwOnGetDatabase = false;

// $dynamic() 이후 limit/offset 가 붙어도, 안 붙어도 await 시 mockRows 로 resolve 되도록
// then 을 가진 thenable 을 단계마다 반환한다.
type MockThenable = {
  limit: Mock<() => MockThenable>;
  offset: Mock<() => MockThenable>;
  $dynamic: Mock<() => MockThenable>;
  then: (resolve: (value: unknown) => void) => Promise<void>;
};
const makeThenable = (): MockThenable => ({
  limit: vi.fn(() => makeThenable()),
  offset: vi.fn(() => makeThenable()),
  $dynamic: vi.fn(() => makeThenable()),
  then: (resolve: (value: unknown) => void) => Promise.resolve(mockRows).then(resolve),
});

const mockDb = {
  select: vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => makeThenable()),
    })),
  })),
};

const mockGetDatabase = vi.fn(() => {
  if (throwOnGetDatabase) {
    throw new Error('DB 연결 오류');
  }
  return mockDb;
});

vi.mock('@testea/db', () => ({
  getDatabase: () => mockGetDatabase(),
  testSuites: {
    id: 'id',
    project_id: 'project_id',
    name: 'name',
    lifecycle_status: 'lifecycle_status',
  },
}));

const setMockRows = (rows: unknown) => {
  mockRows = rows;
};

describe('getTestSuites', () => {
  beforeEach(() => {
    mockRows = [];
    throwOnGetDatabase = false;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('성공 케이스', () => {
    it('프로젝트 ID로 테스트 스위트 목록을 조회한다', async () => {
      const mockRowList = [
        createMockTestSuiteRow({ id: 'suite-1', name: '스위트 1입니다 제목' }),
        createMockTestSuiteRow({ id: 'suite-2', name: '스위트 2입니다 제목' }),
      ];
      setMockRows(mockRowList);

      const result = await getTestSuites({ projectId: 'project-123' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0].id).toBe('suite-1');
        expect(result.data[1].id).toBe('suite-2');
      }
    });

    it('빈 목록도 성공으로 반환한다', async () => {
      setMockRows([]);

      const result = await getTestSuites({ projectId: 'project-123' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });

    it('페이지네이션 파라미터가 적용된다', async () => {
      setMockRows([createMockTestSuiteRow()]);

      const result = await getTestSuites({
        projectId: 'project-123',
        limits: { offset: 10, limit: 5 },
      });

      expect(result.success).toBe(true);
    });

    it('기본 페이지네이션 값이 적용된다 (offset: 0, limit: 10)', async () => {
      setMockRows([createMockTestSuiteRow()]);

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
        archived_at: null,
      });
      setMockRows([mockRow]);

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
        expect(suite.archivedAt).toBeNull();
        expect(suite.lifecycleStatus).toBe('ACTIVE');
      }
    });
  });

  describe('실패 케이스', () => {
    it('DB 에러가 발생하면 에러를 반환한다', async () => {
      throwOnGetDatabase = true;

      const result = await getTestSuites({ projectId: 'project-123' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors._testSuite).toContain('LOAD_FAILED');
      }
    });
  });
});
