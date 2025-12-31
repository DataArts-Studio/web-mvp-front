import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockReturning = vi.fn();
const mockValues = vi.fn(() => ({ returning: mockReturning }));
const mockInsert = vi.fn(() => ({ values: mockValues }));
const mockDb = { insert: mockInsert };

vi.mock('@/shared/lib/db', () => ({
  getDatabase: vi.fn(() => mockDb),
  testCases: {},
}));

vi.mock('uuid', () => ({
  v7: vi.fn(() => '0193b5e0-0000-7000-8000-000000000001'),
}));

import { createTestCase } from '@/entities/test-case/api/server-actions';
import type { CreateTestCase } from '@/entities/test-case/model/types';

describe('createTestCase', () => {
  const mockInput: CreateTestCase = {
    projectId: '0193b5e0-0000-7000-8000-000000000001',
    testSuiteId: '0193b5e0-0000-7000-8000-000000000002',
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
    test_suite_id: '0193b5e0-0000-7000-8000-000000000002',
    case_key: 'TC-001',
    name: '테스트 케이스 제목',
    test_type: 'manual',
    tags: ['tag1', 'tag2'],
    pre_condition: '사전 조건',
    steps: '테스트 스텝',
    expected_result: '기대 결과',
    sort_order: 1,
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
    deleted_at: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('테스트 케이스 생성 성공 시 success: true와 성공 메시지를 반환한다.', async () => {
    mockReturning.mockResolvedValue([mockInsertedRow]);

    const result = await createTestCase(mockInput);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.message).toBe('테스트 케이스를 생성하였습니다.');
      expect(result.data).toEqual({
        id: '0193b5e0-0000-7000-8000-000000000001',
        projectId: '0193b5e0-0000-7000-8000-000000000001',
        testSuiteId: '0193b5e0-0000-7000-8000-000000000002',
        caseKey: 'TC-001',
        title: '테스트 케이스 제목',
        testType: 'manual',
        tags: ['tag1', 'tag2'],
        preCondition: '사전 조건',
        testSteps: '테스트 스텝',
        expectedResult: '기대 결과',
        sortOrder: 1,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        deletedAt: null,
      });
    }
    expect(mockInsert).toHaveBeenCalled();
    expect(mockValues).toHaveBeenCalled();
    expect(mockReturning).toHaveBeenCalled();
  });

  it('테스트 케이스 생성 실패 시 (inserted가 없을 때) success: false와 에러 메시지를 반환한다.', async () => {
    mockReturning.mockResolvedValue([undefined]);

    const result = await createTestCase(mockInput);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toEqual({
        _testCase: ['테스트케이스를 생성하는 도중 오류가 발생했습니다.'],
      });
    }
  });

  it('DB 에러 발생 시 success: false와 에러 메시지를 반환한다.', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockReturning.mockRejectedValue(new Error('DB Connection Error'));

    const result = await createTestCase(mockInput);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toEqual({
        _testCase: ['테스트케이스를 생성하는 도중 오류가 발생했습니다.'],
      });
    }
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error creating test case:', expect.any(Error));

    consoleErrorSpy.mockRestore();
  });
});
