import { createTestCase } from '@/entities/test-case/api/server-actions';
import type { CreateTestCase } from '@/entities/test-case/model/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// 접근 권한·저장 용량·버전 스냅샷·런 동기화는 createTestCase 의 부수 의존성이므로
// 단위 테스트에서는 통과(권한 허용·용량 OK)로 고정한다.
vi.mock('@/access/lib/require-access', () => ({
  requireProjectAccess: vi.fn(() => Promise.resolve(true)),
}));
vi.mock('@/shared/lib/storage/check-storage-limit', () => ({
  checkStorageLimit: vi.fn(() => Promise.resolve(null)),
}));
vi.mock('@/entities/test-case-version/api/actions', () => ({
  createVersionSnapshot: vi.fn(() => Promise.resolve()),
}));
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

const mockReturning = vi.fn();
const mockTx = {
  select: vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve([{ max: 0 }])),
    })),
  })),
  insert: vi.fn(() => ({
    values: vi.fn(() => ({ returning: mockReturning })),
  })),
};
const mockDb = {
  transaction: vi.fn((cb: (tx: typeof mockTx) => unknown) => cb(mockTx)),
};

vi.mock('@testea/db', () => ({
  getDatabase: vi.fn(() => mockDb),
  testCases: {
    display_id: 'display_id',
    project_id: 'project_id',
  },
  testCaseRuns: {},
  testRunSuites: {},
  testRuns: {},
  milestoneTestSuites: {},
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

vi.mock('uuid', () => ({
  v7: vi.fn(() => '0193b5e0-0000-7000-8000-000000000001'),
}));

describe('createTestCase', () => {
  const mockInput: CreateTestCase = {
    projectId: '0193b5e0-0000-7000-8000-000000000001',
    testSuiteId: undefined,
    caseKey: 'TC-001',
    title: '테스트 케이스 제목',
    testType: 'manual',
    tags: ['tag1', 'tag2'],
    preCondition: '사전 조건',
    testSteps: '테스트 스텝',
    expectedResult: '기대 결과',
    sortOrder: 1,
  };

  const mockInsertedRow = {
    id: '0193b5e0-0000-7000-8000-000000000001',
    project_id: '0193b5e0-0000-7000-8000-000000000001',
    test_suite_id: null,
    section_id: null,
    display_id: 1,
    case_key: 'TC-001',
    name: '테스트 케이스 제목',
    test_type: 'manual',
    tags: ['tag1', 'tag2'],
    pre_condition: '사전 조건',
    steps: '테스트 스텝',
    expected_result: '기대 결과',
    sort_order: 1,
    result_status: 'untested',
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
    archived_at: null,
    lifecycle_status: 'ACTIVE',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('테스트 케이스 생성 성공 시 success: true와 성공 메시지 코드를 반환한다.', async () => {
    mockReturning.mockResolvedValue([mockInsertedRow]);

    const result = await createTestCase(mockInput);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.message).toBe('CASE_CREATED');
      expect(result.data).toEqual({
        id: '0193b5e0-0000-7000-8000-000000000001',
        projectId: '0193b5e0-0000-7000-8000-000000000001',
        testSuiteId: undefined,
        sectionId: null,
        displayId: 1,
        caseKey: 'TC-001',
        title: '테스트 케이스 제목',
        testType: 'manual',
        tags: ['tag1', 'tag2'],
        preCondition: '사전 조건',
        testSteps: '테스트 스텝',
        expectedResult: '기대 결과',
        sortOrder: 1,
        resultStatus: 'untested',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        archivedAt: null,
        lifecycleStatus: 'ACTIVE',
      });
    }
  });

  it('테스트 케이스 생성 실패 시 (inserted가 없을 때) success: false와 에러 코드를 반환한다.', async () => {
    mockReturning.mockResolvedValue([undefined]);

    const result = await createTestCase(mockInput);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toEqual({
        _testCase: ['CREATE_FAILED'],
      });
    }
  });

  it('DB 에러 발생 시 success: false와 에러 코드를 반환한다.', async () => {
    mockReturning.mockRejectedValue(new Error('DB Connection Error'));

    const result = await createTestCase(mockInput);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toEqual({
        _testCase: ['CREATE_FAILED'],
      });
    }
  });
});
