import { beforeEach, describe, expect, it, vi } from 'vitest';

import { reorderTestCase, reorderTestSuite } from './actions';

// 전역 setup 은 requireProjectAccess 를 항상 true 로 mock 한다. IDOR 거부 경로를 검증하려면
// 이 파일에서 동적 mock 으로 덮어 true/false 를 제어한다.
const { mockAccess } = vi.hoisted(() => ({ mockAccess: vi.fn() }));
vi.mock('@/access/lib/require-access', () => ({ requireProjectAccess: mockAccess }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));

const mockLimit = vi.fn();
const mockUpdateWhere = vi.fn(() => Promise.resolve());
const mockUpdate = vi.fn(() => ({ set: vi.fn(() => ({ where: mockUpdateWhere })) }));
const mockDb = {
  select: vi.fn(() => ({
    from: vi.fn(() => ({ where: vi.fn(() => ({ limit: mockLimit })) })),
  })),
  update: mockUpdate,
};
vi.mock('@testea/db', () => ({
  getDatabase: () => mockDb,
  testCases: { id: 'id', project_id: 'project_id' },
  testSuites: { id: 'id', project_id: 'project_id' },
}));

describe('reorder 액션 — IDOR 가드 회귀', () => {
  beforeEach(() => {
    mockAccess.mockReset();
    mockLimit.mockReset();
    mockUpdate.mockClear();
    mockUpdateWhere.mockClear();
  });

  it('reorderTestCase: 대상 소유 프로젝트 접근이 거부되면 실패하고 UPDATE 하지 않는다', async () => {
    mockLimit.mockResolvedValue([{ projectId: 'proj-1' }]);
    mockAccess.mockResolvedValue(false);

    const result = await reorderTestCase('case-1', 1000);

    expect(result.success).toBe(false);
    expect(mockAccess).toHaveBeenCalledWith('proj-1');
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('reorderTestCase: 접근이 허용되면 UPDATE 를 수행한다', async () => {
    mockLimit.mockResolvedValue([{ projectId: 'proj-1' }]);
    mockAccess.mockResolvedValue(true);

    const result = await reorderTestCase('case-1', 1000);

    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  it('reorderTestCase: 대상 케이스가 없으면 권한검사 전에 실패한다', async () => {
    mockLimit.mockResolvedValue([]);

    const result = await reorderTestCase('missing', 1000);

    expect(result.success).toBe(false);
    expect(mockAccess).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('reorderTestSuite: 접근이 거부되면 실패하고 UPDATE 하지 않는다', async () => {
    mockLimit.mockResolvedValue([{ projectId: 'proj-1' }]);
    mockAccess.mockResolvedValue(false);

    const result = await reorderTestSuite('suite-1', 1000);

    expect(result.success).toBe(false);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
