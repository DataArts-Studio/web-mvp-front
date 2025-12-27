import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

// DB 모킹
const mockWhere = vi.fn();
const mockFrom = vi.fn(() => ({ where: mockWhere }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));
const mockDb = { select: mockSelect };

vi.mock('@/shared/lib/db', () => ({
  getDatabase: vi.fn(() => mockDb),
  testCase: { project_id: 'project_id' },
}));

import { getTestCases } from './server-actions';

describe('getTestCases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('테스트 케이스 조회 성공 시 success: true와 데이터를 반환한다', async () => {
    const mockRows = [
      {
        id: 'tc-1',
        project_id: 'proj-1',
        test_suite_id: 'suite-1',
        case_key: 'TC-001',
        name: '로그인 테스트',
        test_type: 'functional',
        tags: ['auth', 'login'],
        pre_condition: '사용자가 로그아웃 상태',
        steps: '1. 로그인 페이지 접속\n2. 아이디/비밀번호 입력',
        expected_result: '로그인 성공',
        sort_order: 1,
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-02'),
        deleted_at: null,
      },
    ];

    mockWhere.mockResolvedValue(mockRows);

    const result = await getTestCases({ project_id: 'proj-1' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({
        id: 'tc-1',
        projectId: 'proj-1',
        testSuiteId: 'suite-1',
        caseKey: 'TC-001',
        title: '로그인 테스트',
        testType: 'functional',
        tags: ['auth', 'login'],
        preCondition: '사용자가 로그아웃 상태',
        testSteps: '1. 로그인 페이지 접속\n2. 아이디/비밀번호 입력',
        expectedResult: '로그인 성공',
        sortOrder: 1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        deletedAt: null,
      });
    }

    expect(mockSelect).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalled();
    expect(mockWhere).toHaveBeenCalled();
  });

  it('테스트 케이스가 없으면 빈 배열을 반환한다', async () => {
    mockWhere.mockResolvedValue([]);

    const result = await getTestCases({ project_id: 'empty-project' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([]);
    }
  });

  it('DB 에러 발생 시 success: false와 에러 메시지를 반환한다', async () => {
    mockWhere.mockRejectedValue(new Error('DB connection failed'));

    const result = await getTestCases({ project_id: 'proj-1' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toHaveProperty('_testCase');
    }
  });

  it('null 필드들이 기본값으로 변환된다', async () => {
    const mockRows = [
      {
        id: 'tc-2',
        project_id: null,
        test_suite_id: null,
        case_key: null,
        name: '테스트',
        test_type: null,
        tags: null,
        pre_condition: null,
        steps: null,
        expected_result: null,
        sort_order: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
    ];

    mockWhere.mockResolvedValue(mockRows);

    const result = await getTestCases({ project_id: 'proj-1' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].projectId).toBe('');
      expect(result.data[0].testSuiteId).toBe('');
      expect(result.data[0].caseKey).toBe('');
      expect(result.data[0].testType).toBe('');
      expect(result.data[0].tags).toEqual([]);
      expect(result.data[0].preCondition).toBe('');
      expect(result.data[0].testSteps).toBe('');
      expect(result.data[0].expectedResult).toBe('');
      expect(result.data[0].sortOrder).toBe(0);
    }
  });
});
