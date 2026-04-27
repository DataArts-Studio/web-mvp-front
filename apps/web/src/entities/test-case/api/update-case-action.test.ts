import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

// Mock for update chain
const mockReturning = vi.fn();
const mockWhere = vi.fn(() => ({ returning: mockReturning }));
const mockSet = vi.fn(() => ({ where: mockWhere }));
const mockUpdate = vi.fn(() => ({ set: mockSet }));

const mockDb = {
  update: mockUpdate,
};

vi.mock('@/shared/lib/db', () => ({
  getDatabase: vi.fn(() => mockDb),
  testCases: {
    id: 'id',
    name: 'name',
    test_type: 'test_type',
    tags: 'tags',
    pre_condition: 'pre_condition',
    steps: 'steps',
    expected_result: 'expected_result',
    sort_order: 'sort_order',
    updated_at: 'updated_at',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ field: a, value: b })),
}));

import { updateTestCase } from './server-actions';

describe('updateTestCase', () => {
  const mockUpdatedRow = {
    id: 'tc-123',
    project_id: 'proj-1',
    case_key: 'TC-001',
    name: '수정된 테스트',
    test_type: 'functional',
    tags: ['tag1', 'tag2'],
    pre_condition: '사전 조건',
    steps: '1. 스텝 1\n2. 스텝 2',
    expected_result: '기대 결과',
    sort_order: 1,
    result_status: 'untested',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-02'),
    archived_at: null,
    lifecycle_status: 'ACTIVE',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockReturning.mockResolvedValue([mockUpdatedRow]);
  });

  it('테스트 케이스 수정 성공 시 수정된 데이터를 반환한다', async () => {
    const result = await updateTestCase({
      id: 'tc-123',
      title: '수정된 테스트',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('tc-123');
      expect(result.data.title).toBe('수정된 테스트');
      expect(result.message).toBe('테스트케이스를 수정하였습니다.');
    }
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalled();
    expect(mockWhere).toHaveBeenCalled();
    expect(mockReturning).toHaveBeenCalled();
  });

  it('title 필드만 업데이트할 수 있다', async () => {
    await updateTestCase({
      id: 'tc-123',
      title: '새 제목',
    });

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        name: '새 제목',
      })
    );
  });

  it('testType 필드를 업데이트할 수 있다', async () => {
    await updateTestCase({
      id: 'tc-123',
      testType: 'regression',
    });

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        test_type: 'regression',
      })
    );
  });

  it('tags 필드를 업데이트할 수 있다', async () => {
    await updateTestCase({
      id: 'tc-123',
      tags: ['새태그1', '새태그2'],
    });

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        tags: ['새태그1', '새태그2'],
      })
    );
  });

  it('여러 필드를 동시에 업데이트할 수 있다', async () => {
    await updateTestCase({
      id: 'tc-123',
      title: '새 제목',
      testType: 'integration',
      preCondition: '새 사전조건',
      testSteps: '새 스텝',
      expectedResult: '새 결과',
      sortOrder: 5,
    });

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        name: '새 제목',
        test_type: 'integration',
        pre_condition: '새 사전조건',
        steps: '새 스텝',
        expected_result: '새 결과',
        sort_order: 5,
      })
    );
  });

  it('업데이트 시 항상 updated_at이 설정된다', async () => {
    await updateTestCase({
      id: 'tc-123',
      title: '새 제목',
    });

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        updated_at: expect.any(Date),
      })
    );
  });

  it('테스트 케이스가 존재하지 않으면 에러를 반환한다', async () => {
    mockReturning.mockResolvedValue([]);

    const result = await updateTestCase({
      id: 'non-existent',
      title: '새 제목',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors._testCase).toContain('테스트케이스를 찾을 수 없습니다.');
    }
  });

  it('DB 에러 발생 시 에러 메시지를 반환한다', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockReturning.mockRejectedValue(new Error('DB Error'));

    const result = await updateTestCase({
      id: 'tc-123',
      title: '새 제목',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors._testCase).toContain('테스트케이스를 수정하는 도중 오류가 발생했습니다.');
    }
    consoleErrorSpy.mockRestore();
  });
});
