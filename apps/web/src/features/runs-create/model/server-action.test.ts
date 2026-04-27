import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

// Sentry mock
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

// 접근 권한 mock
vi.mock('@/access/lib/require-access', () => ({
  requireProjectAccess: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('@/shared/lib/db/check-storage-limit', () => ({
  checkStorageLimit: vi.fn(() => Promise.resolve(null)),
}));

// uuid mock
vi.mock('uuid', () => ({
  v7: vi.fn(() => 'mock-uuid'),
}));

// 트랜잭션 내부의 insert/select mock
const mockTxReturning = vi.fn();
const mockTxValues = vi.fn(() => ({ returning: mockTxReturning }));
const mockTxOnConflictDoNothing = vi.fn();
const mockTxInsert = vi.fn(() => ({
  values: vi.fn(() => ({
    returning: mockTxReturning,
    onConflictDoNothing: mockTxOnConflictDoNothing,
  })),
}));

const mockTxSelectWhere = vi.fn(() => []);
const mockTxSelectFrom = vi.fn(() => ({ where: mockTxSelectWhere }));
const mockTxSelect = vi.fn(() => ({ from: mockTxSelectFrom }));

// 트랜잭션 객체
const mockTx = {
  insert: mockTxInsert,
  select: mockTxSelect,
};

// 트랜잭션 실행 - callback을 실행하고 결과 반환
const mockTransaction = vi.fn(async (callback) => {
  return callback(mockTx);
});

const mockDb = {
  transaction: mockTransaction,
};

vi.mock('@/shared/lib/db', () => ({
  getDatabase: vi.fn(() => mockDb),
  testRuns: {
    id: 'id',
    project_id: 'project_id',
    name: 'name',
    description: 'description',
    status: 'status',
    milestone_id: 'milestone_id',
    created_at: 'created_at',
    updated_at: 'updated_at',
    archived_at: 'archived_at',
    lifecycle_status: 'lifecycle_status',
  },
  testRunSuites: {
    test_run_id: 'test_run_id',
    test_suite_id: 'test_suite_id',
  },
  testCaseRuns: {
    test_run_id: 'test_run_id',
    test_case_id: 'test_case_id',
  },
  testCases: {
    id: 'id',
    test_suite_id: 'test_suite_id',
    lifecycle_status: 'lifecycle_status',
  },
  milestoneTestCases: {
    test_case_id: 'test_case_id',
    milestone_id: 'milestone_id',
  },
  milestoneTestSuites: {
    test_suite_id: 'test_suite_id',
    milestone_id: 'milestone_id',
  },
  checkStorageLimit: vi.fn(() => Promise.resolve(null)),
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ field: a, value: b })),
  inArray: vi.fn((a, b) => ({ field: a, values: b })),
  and: vi.fn((...conditions) => ({ and: conditions })),
}));

import { createTestRunAction } from './server-action';

type FlatErrors = {
  formErrors: string[];
  fieldErrors: Record<string, string[] | undefined>;
};

describe('createTestRunAction', () => {
  const validMilestoneId = '550e8400-e29b-41d4-a716-446655440099';

  const validInput = {
    project_id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Test Run 1',
    description: '테스트 설명',
    milestone_id: validMilestoneId,
  };

  const mockCreatedRun = {
    id: 'run-uuid-123',
    project_id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Test Run 1',
    description: '테스트 설명',
    status: 'NOT_STARTED',
    milestone_id: validMilestoneId,
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
    archived_at: null,
    lifecycle_status: 'ACTIVE',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockTxReturning.mockResolvedValue([mockCreatedRun]);
    mockTxSelectWhere.mockResolvedValue([]);
  });

  describe('유효성 검사', () => {
    it('project_id가 없으면 유효성 검사 에러를 반환한다', async () => {
      const invalidInput = {
        name: 'Test Run',
        milestone_id: validMilestoneId,
      };

      // @ts-expect-error -- 의도적으로 project_id 누락
      const result = await createTestRunAction(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.errors as FlatErrors;
        expect(errors.fieldErrors['project_id']).toBeDefined();
      }
    });

    it('project_id가 유효한 UUID가 아니면 에러를 반환한다', async () => {
      const invalidInput = {
        project_id: 'invalid-uuid',
        name: 'Test Run',
        milestone_id: validMilestoneId,
      };

      const result = await createTestRunAction(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.errors as FlatErrors;
        expect(errors.fieldErrors['project_id']).toBeDefined();
      }
    });

    it('name이 없으면 유효성 검사 에러를 반환한다', async () => {
      const invalidInput = {
        project_id: '550e8400-e29b-41d4-a716-446655440000',
        name: '',
        milestone_id: validMilestoneId,
      };

      const result = await createTestRunAction(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.errors as FlatErrors;
        expect(errors.fieldErrors['name']).toBeDefined();
      }
    });
  });

  describe('테스트 런 생성', () => {
    it('기본 입력으로 테스트 런을 성공적으로 생성한다', async () => {
      const result = await createTestRunAction(validInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.testRun!.id).toBe('run-uuid-123');
        expect(result.testRun!.name).toBe('Test Run 1');
      }
      expect(mockTransaction).toHaveBeenCalled();
      expect(mockTxInsert).toHaveBeenCalled();
    });

    it('milestone_id가 제공되면 마일스톤을 연결한다', async () => {
      const result = await createTestRunAction(validInput);

      expect(result.success).toBe(true);
      expect(mockTxInsert).toHaveBeenCalled();
    });

    it('description이 없어도 생성에 성공한다', async () => {
      const inputWithoutDescription = {
        project_id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Run Without Description',
        milestone_id: validMilestoneId,
      };

      const result = await createTestRunAction(inputWithoutDescription);

      expect(result.success).toBe(true);
    });
  });

  describe('에러 처리', () => {
    it('트랜잭션 에러 발생 시 에러를 반환한다', async () => {
      mockTransaction.mockRejectedValueOnce(new Error('Transaction failed'));

      const result = await createTestRunAction(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors!.formErrors[0]).toContain('테스트 실행 생성에 실패했습니다');
      }
    });

    it('insert 에러 발생 시 에러를 반환한다', async () => {
      mockTxReturning.mockRejectedValueOnce(new Error('Insert failed'));

      const result = await createTestRunAction(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors!.formErrors[0]).toContain('테스트 실행 생성에 실패했습니다');
      }
    });
  });
});
