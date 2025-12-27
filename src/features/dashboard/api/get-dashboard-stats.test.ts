import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

// DB 모킹
const mockLimit = vi.fn();
const mockWhere = vi.fn(() => ({ limit: mockLimit }));
const mockFrom = vi.fn(() => ({ where: mockWhere }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));

const mockGroupBy = vi.fn();
const mockLeftJoinWhere = vi.fn(() => ({ groupBy: mockGroupBy }));
const mockLeftJoin = vi.fn(() => ({ where: mockLeftJoinWhere }));
const mockFromJoin = vi.fn(() => ({ leftJoin: mockLeftJoin }));
const mockSelectJoin = vi.fn(() => ({ from: mockFromJoin }));

const mockOrderBy = vi.fn(() => ({ limit: vi.fn() }));
const mockWhereOrder = vi.fn(() => ({ orderBy: mockOrderBy }));
const mockFromOrder = vi.fn(() => ({ where: mockWhereOrder }));
const mockSelectOrder = vi.fn(() => ({ from: mockFromOrder }));

const mockDb = {
  select: vi.fn(),
};

vi.mock('@/shared/lib/db', () => ({
  getDatabase: vi.fn(() => mockDb),
  project: { id: 'id', name: 'name' },
  suite: { id: 'id', name: 'name', project_id: 'project_id' },
  testCase: { id: 'id', name: 'name', project_id: 'project_id', test_suite_id: 'test_suite_id' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ field: a, value: b })),
  count: vi.fn(() => 'count'),
  desc: vi.fn((field) => ({ desc: field })),
  isNull: vi.fn((field) => ({ isNull: field })),
}));

import { getDashboardStats } from './get-dashboard-stats';

describe('getDashboardStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('프로젝트가 존재하면 대시보드 통계를 반환한다', async () => {
    const mockProject = {
      id: 'proj-1',
      name: 'Test Project',
      identifier: 'test-proj',
      description: 'Test Description',
      owner_name: 'Owner',
      created_at: new Date('2024-01-01'),
    };

    const mockTestCaseCount = { count: 10 };
    const mockSuites = [
      { id: 'suite-1', name: 'Suite 1', description: 'Desc 1', caseCount: 5 },
      { id: 'suite-2', name: 'Suite 2', description: null, caseCount: 3 },
    ];
    const mockRecentCases = [
      { id: 'tc-1', title: 'Test Case 1', createdAt: new Date('2024-01-05') },
    ];
    const mockRecentSuites = [
      { id: 'suite-1', title: 'Suite 1', createdAt: new Date('2024-01-03') },
    ];

    let callCount = 0;
    mockDb.select.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // 프로젝트 조회
        return {
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue([mockProject]),
            })),
          })),
        };
      } else if (callCount === 2) {
        // 테스트 케이스 카운트
        return {
          from: vi.fn(() => ({
            where: vi.fn().mockResolvedValue([mockTestCaseCount]),
          })),
        };
      } else if (callCount === 3) {
        // 스위트 목록
        return {
          from: vi.fn(() => ({
            leftJoin: vi.fn(() => ({
              where: vi.fn(() => ({
                groupBy: vi.fn().mockResolvedValue(mockSuites),
              })),
            })),
          })),
        };
      } else if (callCount === 4) {
        // 최근 테스트 케이스
        return {
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              orderBy: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue(mockRecentCases),
              })),
            })),
          })),
        };
      } else {
        // 최근 스위트
        return {
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              orderBy: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue(mockRecentSuites),
              })),
            })),
          })),
        };
      }
    });

    const result = await getDashboardStats({ projectId: 'proj-1' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.project.id).toBe('proj-1');
      expect(result.data.project.name).toBe('Test Project');
      expect(result.data.testCases.total).toBe(10);
      expect(result.data.testSuites).toHaveLength(2);
      expect(result.data.testSuites[0].caseCount).toBe(5);
      expect(result.data.recentActivities).toHaveLength(2);
    }
  });

  it('프로젝트가 존재하지 않으면 에러를 반환한다', async () => {
    mockDb.select.mockImplementation(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue([]),
        })),
      })),
    }));

    const result = await getDashboardStats({ projectId: 'non-existent' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toHaveProperty('_project');
    }
  });

  it('DB 에러 발생 시 에러를 반환한다', async () => {
    mockDb.select.mockImplementation(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn().mockRejectedValue(new Error('DB Error')),
        })),
      })),
    }));

    const result = await getDashboardStats({ projectId: 'proj-1' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toHaveProperty('_dashboard');
    }
  });
});
