import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

// 각 쿼리별 결과를 저장
let queryResults: Map<string, unknown[]> = new Map();
let callOrder: string[] = [];

// 각 select()마다 새로운 체인 생성
const createQueryChain = (queryId: string) => {
  callOrder.push(queryId);

  const getResult = () => {
    const results = queryResults.get(queryId) ?? [];
    return Promise.resolve(results);
  };

  const chain: any = {
    select: vi.fn(() => chain),
    from: vi.fn((table) => {
      // from 호출 시 테이블 정보 기록
      return chain;
    }),
    where: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    offset: vi.fn(() => chain),
    orderBy: vi.fn(() => chain),
    then: (resolve: (value: unknown) => void, reject?: (reason: unknown) => void) =>
      getResult().then(resolve, reject),
    catch: (reject: (reason: unknown) => void) => getResult().catch(reject),
    finally: (callback: () => void) => getResult().finally(callback),
  };

  return chain;
};

let selectCallCount = 0;
const mockSelect = vi.fn(() => {
  const queryId = `query_${selectCallCount++}`;
  return createQueryChain(queryId);
});

const mockDb = { select: mockSelect };

vi.mock('@/shared/lib/db', () => ({
  getDatabase: vi.fn(() => mockDb),
  projects: {
    id: 'id',
    name: 'name',
    identifier: 'identifier',
    description: 'description',
    owner_name: 'owner_name',
    created_at: 'created_at',
  },
  testSuites: {
    id: 'id',
    name: 'name',
    project_id: 'project_id',
    description: 'description',
    created_at: 'created_at',
  },
  testCases: {
    id: 'id',
    name: 'name',
    project_id: 'project_id',
    created_at: 'created_at',
  },
  suiteTestCases: {
    suite_id: 'suite_id',
    test_case_id: 'test_case_id',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ field: a, value: b })),
  count: vi.fn(() => 'count'),
  desc: vi.fn((field) => ({ desc: field })),
  isNull: vi.fn((field) => ({ isNull: field })),
  and: vi.fn((...conditions) => ({ and: conditions })),
  notInArray: vi.fn((field, values) => ({ notInArray: { field, values } })),
}));

import { getDashboardStats } from './get-dashboard-stats';

describe('getDashboardStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryResults = new Map();
    callOrder = [];
    selectCallCount = 0;
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

    // 쿼리 순서: 0=project, 1=testCaseCount, 2=subquery, 3=unassignedCount,
    // 4=suiteRows, 5=suiteCaseCount(for suite-1), 6=suiteCaseCount(for suite-2),
    // 7=recentTestCases, 8=recentSuites
    queryResults.set('query_0', [mockProject]);
    queryResults.set('query_1', [{ count: 10 }]);
    queryResults.set('query_2', []); // subquery
    queryResults.set('query_3', [{ count: 2 }]);
    queryResults.set('query_4', [
      { id: 'suite-1', name: 'Suite 1', description: 'Desc 1' },
      { id: 'suite-2', name: 'Suite 2', description: null },
    ]);
    queryResults.set('query_5', [{ count: 5 }]);
    queryResults.set('query_6', [{ count: 3 }]);
    queryResults.set('query_7', [
      { id: 'tc-1', title: 'Test Case 1', created_at: new Date('2024-01-05') },
    ]);
    queryResults.set('query_8', [
      { id: 'suite-1', title: 'Suite 1', created_at: new Date('2024-01-03') },
    ]);

    const result = await getDashboardStats({ slug: 'proj-1' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.project.id).toBe('proj-1');
      expect(result.data.project.name).toBe('Test Project');
      expect(result.data.testCases.total).toBe(10);
      expect(result.data.testCases.unassigned).toBe(2);
      expect(result.data.testSuites).toHaveLength(2);
      expect(result.data.testSuites[0].case_count).toBe(5);
      expect(result.data.testSuites[1].case_count).toBe(3);
      expect(result.data.recentActivities).toHaveLength(2);
    }
  });

  it('프로젝트가 존재하지 않으면 에러를 반환한다', async () => {
    queryResults.set('query_0', []);

    const result = await getDashboardStats({ slug: 'non-existent' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toHaveProperty('_project');
    }
  });

  it('DB 에러 발생 시 에러를 반환한다', async () => {
    // select를 호출하면 에러를 던지도록 설정
    mockSelect.mockImplementationOnce(() => {
      throw new Error('DB Error');
    });

    const result = await getDashboardStats({ slug: 'proj-1' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toHaveProperty('_dashboard');
    }
  });
});
