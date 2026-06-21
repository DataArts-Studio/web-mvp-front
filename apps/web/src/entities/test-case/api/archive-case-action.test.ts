import { createMockTestCaseRow } from '@/shared/test/__mocks__/db';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { archiveTestCase } from './server-actions';

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

vi.mock('@testea/db', () => ({
  getDatabase: vi.fn(() => mockDb),
  testCases: {
    id: 'id',
    project_id: 'project_id',
    archived_at: 'archived_at',
    lifecycle_status: 'lifecycle_status',
    updated_at: 'updated_at',
  },
}));

vi.mock('drizzle-orm', () => ({
  and: vi.fn((...args) => args),
  asc: vi.fn(),
  desc: vi.fn(),
  eq: vi.fn((a, b) => ({ field: a, value: b })),
  ilike: vi.fn(),
  inArray: vi.fn(),
  or: vi.fn(),
  sql: Object.assign(vi.fn(), { raw: vi.fn() }),
}));

describe('archiveTestCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectLimit.mockResolvedValue([{ projectId: 'project-123' }]);
    mockReturning.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('테스트 케이스를 아카이브(Soft Delete)하면 성공 메시지 코드와 ID를 반환한다', async () => {
    const testCaseId = 'test-case-id';
    const mockArchivedTestCase = createMockTestCaseRow({ id: testCaseId });
    mockReturning.mockResolvedValue([mockArchivedTestCase]);

    const result = await archiveTestCase(testCaseId);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(testCaseId);
      expect(result.message).toBe('CASE_MOVED_TO_TRASH');
    }
  });

  it('아카이브할 테스트 케이스가 존재하지 않으면 에러 코드를 반환한다', async () => {
    mockReturning.mockResolvedValue([]);

    const result = await archiveTestCase('non-existent-id');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors._testCase).toContain('NOT_FOUND');
    }
  });

  it('데이터베이스 업데이트 중 오류가 발생하면 에러 코드를 반환한다', async () => {
    mockUpdate.mockImplementationOnce(() => {
      throw new Error('DB Error');
    });

    const result = await archiveTestCase('any-id');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors._testCase).toContain('DELETE_FAILED');
    }
  });
});
