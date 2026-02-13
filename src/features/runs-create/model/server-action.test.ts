import { beforeEach, describe, expect, it, vi } from 'vitest';

// 트랜잭션 내부의 insert mock
const mockTxReturning = vi.fn();
const mockTxValues = vi.fn(() => ({ returning: mockTxReturning }));
const mockTxInsert = vi.fn(() => ({ values: mockTxValues }));

// 트랜잭션 객체
const mockTx = {
  insert: mockTxInsert,
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
    created_at: 'created_at',
    updated_at: 'updated_at',
    archived_at: 'archived_at',
    lifecycle_status: 'lifecycle_status',
  },
  testRunSuites: {
    test_run_id: 'test_run_id',
    test_suite_id: 'test_suite_id',
  },
}));

import { createTestRunAction } from './server-action';

describe('createTestRunAction', () => {
  const validInput = {
    project_id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Test Run 1',
    description: '테스트 설명',
  };

  const mockCreatedRun = {
    id: 'run-uuid-123',
    project_id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Test Run 1',
    description: '테스트 설명',
    status: 'NOT_STARTED',
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
    archived_at: null,
    lifecycle_status: 'ACTIVE',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // 기본적으로 insert().values().returning()이 mockCreatedRun 반환
    mockTxReturning.mockResolvedValue([mockCreatedRun]);
  });

  describe('유효성 검사', () => {
    it('project_id가 없으면 유효성 검사 에러를 반환한다', async () => {
      const invalidInput = {
        name: 'Test Run',
      };

      const result = await createTestRunAction(invalidInput as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.fieldErrors.project_id).toBeDefined();
      }
    });

    it('project_id가 유효한 UUID가 아니면 에러를 반환한다', async () => {
      const invalidInput = {
        project_id: 'invalid-uuid',
        name: 'Test Run',
      };

      const result = await createTestRunAction(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.fieldErrors.project_id).toBeDefined();
      }
    });

    it('name이 없으면 유효성 검사 에러를 반환한다', async () => {
      const invalidInput = {
        project_id: '550e8400-e29b-41d4-a716-446655440000',
        name: '',
      };

      const result = await createTestRunAction(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.fieldErrors.name).toBeDefined();
      }
    });
  });

  describe('테스트 런 생성', () => {
    it('기본 입력으로 테스트 런을 성공적으로 생성한다', async () => {
      const result = await createTestRunAction(validInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.testRun.id).toBe('run-uuid-123');
        expect(result.testRun.name).toBe('Test Run 1');
      }
      expect(mockTransaction).toHaveBeenCalled();
      expect(mockTxInsert).toHaveBeenCalled();
    });

    it('suite_ids가 제공되면 테스트 스위트를 연결한다', async () => {
      const inputWithSuites = {
        ...validInput,
        suite_ids: [
          '660e8400-e29b-41d4-a716-446655440001',
          '660e8400-e29b-41d4-a716-446655440002',
        ],
      };

      const result = await createTestRunAction(inputWithSuites);

      expect(result.success).toBe(true);
      // insert가 2번 호출됨 (testRuns + testRunSuites)
      expect(mockTxInsert).toHaveBeenCalledTimes(2);
    });

    it('milestone_id가 제공되면 마일스톤을 연결한다', async () => {
      const inputWithMilestone = {
        ...validInput,
        milestone_id: '770e8400-e29b-41d4-a716-446655440001',
      };

      const result = await createTestRunAction(inputWithMilestone);

      expect(result.success).toBe(true);
      // insert가 1번 호출됨 (testRuns에 milestone_id 포함)
      expect(mockTxInsert).toHaveBeenCalledTimes(1);
    });

    it('suite_ids와 milestone_id 모두 제공되면 둘 다 연결한다', async () => {
      const inputWithBoth = {
        ...validInput,
        suite_ids: ['660e8400-e29b-41d4-a716-446655440001'],
        milestone_id: '770e8400-e29b-41d4-a716-446655440001',
      };

      const result = await createTestRunAction(inputWithBoth);

      expect(result.success).toBe(true);
      // insert가 2번 호출됨 (testRuns + testRunSuites, milestone_id는 testRuns에 포함)
      expect(mockTxInsert).toHaveBeenCalledTimes(2);
    });

    it('description이 없어도 생성에 성공한다', async () => {
      const inputWithoutDescription = {
        project_id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Run Without Description',
      };

      const result = await createTestRunAction(inputWithoutDescription);

      expect(result.success).toBe(true);
    });
  });

  describe('에러 처리', () => {
    it('트랜잭션 에러 발생 시 에러를 반환한다', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockTransaction.mockRejectedValueOnce(new Error('Transaction failed'));

      const result = await createTestRunAction(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.formErrors[0]).toContain('테스트 실행 생성에 실패했습니다');
      }
      consoleErrorSpy.mockRestore();
    });

    it('insert 에러 발생 시 에러를 반환한다', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockTxReturning.mockRejectedValueOnce(new Error('Insert failed'));

      const result = await createTestRunAction(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.formErrors[0]).toContain('테스트 실행 생성에 실패했습니다');
      }
      consoleErrorSpy.mockRestore();
    });
  });
});
