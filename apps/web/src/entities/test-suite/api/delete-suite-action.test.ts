import { createMockTestSuiteRow } from '@/shared/test/__mocks__/db';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { deleteTestSuite } from './server-actions';

// 접근 권한은 archiveTestSuite 의 부수 의존성이므로 단위 테스트에서는 통과로 고정한다.
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

// update(.set().where().returning()) - 스위트 아카이브.
// 하위 케이스 cascade 는 update(.set().where()) 로 returning 없이 await 된다.
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
  testCases: {
    id: 'id',
    test_suite_id: 'test_suite_id',
    lifecycle_status: 'lifecycle_status',
  },
}));

const setMockUpdateReturn = (value: unknown) => {
  mockReturning.mockResolvedValue(value ? [value] : [undefined]);
};

describe('deleteTestSuite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDatabase.mockReturnValue(mockDb);
    mockSelectLimit.mockResolvedValue([{ projectId: 'project-123' }]);
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
        expect(result.message).toBe('SUITE_ARCHIVED');
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
        expect(result.errors._testSuite).toContain('NOT_FOUND');
      }
    });

    it('DB 에러가 발생하면 에러를 반환한다', async () => {
      mockGetDatabase.mockImplementationOnce(() => {
        throw new Error('DB 연결 오류');
      });

      const result = await deleteTestSuite('suite-123');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors._testSuite).toContain('ARCHIVE_FAILED');
      }
    });
  });
});
