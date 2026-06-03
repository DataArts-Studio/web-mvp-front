import { createMockTestSuiteRow } from '@/shared/test/__mocks__/db';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { updateTestSuite } from './server-actions';

// 접근 권한은 updateTestSuite 의 부수 의존성이므로 단위 테스트에서는 통과로 고정한다.
vi.mock('@/access/lib/require-access', () => ({
  requireProjectAccess: vi.fn(() => Promise.resolve(true)),
}));
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

// 접근 권한 확인용 select(.from().where().limit()) → projectId 보유 row
const mockSelectLimit = vi.fn(() => Promise.resolve([{ projectId: 'project-123' }]));
const mockSelectWhere = vi.fn(() => ({ limit: mockSelectLimit }));
const mockSelectFrom = vi.fn(() => ({ where: mockSelectWhere }));
const mockSelect = vi.fn(() => ({ from: mockSelectFrom }));

// update(.set().where().returning())
const mockReturning = vi.fn();
const mockUpdateWhere = vi.fn(() => ({ returning: mockReturning }));
const mockSet = vi.fn(() => ({ where: mockUpdateWhere }));
const mockUpdate = vi.fn(() => ({ set: mockSet }));

const mockDb = {
  select: mockSelect,
  update: mockUpdate,
};

const mockGetDatabase = vi.fn(() => mockDb);

vi.mock('@testea/db', () => ({
  getDatabase: () => mockGetDatabase(),
  testSuites: {
    id: 'id',
    project_id: 'project_id',
    name: 'name',
    lifecycle_status: 'lifecycle_status',
  },
}));

const setMockUpdateReturn = (value: unknown) => {
  mockReturning.mockResolvedValue(value ? [value] : [undefined]);
};

describe('updateTestSuite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDatabase.mockReturnValue(mockDb);
    mockSelectLimit.mockResolvedValue([{ projectId: 'project-123' }]);
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
        expect(result.message).toBe('SUITE_UPDATED');
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
        archived_at: null,
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
          archivedAt: null,
          lifecycleStatus: 'ACTIVE',
          lastExecutedAt: null,
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
        expect(result.errors._testSuite).toContain('NOT_FOUND');
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
        expect(result.errors._testSuite).toContain('UPDATE_FAILED');
      }
    });
  });
});
