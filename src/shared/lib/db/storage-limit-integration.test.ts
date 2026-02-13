import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * 서버 액션에서 checkStorageLimit이 올바르게 호출되는지 검증하는 테스트.
 * 각 액션의 requireProjectAccess 통과 후 checkStorageLimit이 호출되어
 * 용량 초과 시 에러를 반환하는지 확인한다.
 */

// ============================================================================
// Shared mocks
// ============================================================================
const mockCheckStorageLimit = vi.fn();
const mockRequireProjectAccess = vi.fn();

vi.mock('@/access/lib/require-access', () => ({
  requireProjectAccess: (...args: unknown[]) => mockRequireProjectAccess(...args),
}));

vi.mock('@/shared/lib/db', () => ({
  getDatabase: vi.fn(() => mockDb),
  checkStorageLimit: (...args: unknown[]) => mockCheckStorageLimit(...args),
  testCases: { project_id: 'project_id', id: 'id', display_id: 'display_id', lifecycle_status: 'lifecycle_status' },
  testSuites: { project_id: 'project_id', id: 'id', name: 'name', lifecycle_status: 'lifecycle_status' },
  milestones: { project_id: 'project_id', id: 'id', name: 'name', lifecycle_status: 'lifecycle_status' },
  testRuns: { id: 'id', project_id: 'project_id', name: 'name', status: 'status' },
  testRunSuites: { test_run_id: 'test_run_id', test_suite_id: 'test_suite_id' },
  testRunMilestones: { test_run_id: 'test_run_id', milestone_id: 'milestone_id' },
  testCaseRuns: {},
  milestoneTestCases: {},
  milestoneTestSuites: {},
}));

vi.mock('uuid', () => ({
  v7: vi.fn(() => '0193b5e0-0000-7000-8000-000000000001'),
}));

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

// DB mock
const mockReturning = vi.fn();
const mockValues = vi.fn(() => ({ returning: mockReturning }));
const mockInsert = vi.fn(() => ({ values: mockValues }));
const mockSelectWhere = vi.fn(() => ({
  limit: vi.fn(() => Promise.resolve([{ projectId: 'project-123' }])),
}));
const mockSelectFrom = vi.fn(() => ({
  where: mockSelectWhere,
}));
const mockSelect = vi.fn(() => ({ from: mockSelectFrom }));
const mockDb = {
  insert: mockInsert,
  select: mockSelect,
};

const STORAGE_ERROR = {
  success: false as const,
  errors: { _storage: ['프로젝트 저장 용량(50MB)을 초과하였습니다.'] },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireProjectAccess.mockResolvedValue(true);
  mockCheckStorageLimit.mockResolvedValue(null); // 기본: 통과
});

// ============================================================================
// createTestCase
// ============================================================================
describe('createTestCase - storage limit', () => {
  let createTestCase: typeof import('@/entities/test-case/api/server-actions').createTestCase;

  beforeEach(async () => {
    const mod = await import('@/entities/test-case/api/server-actions');
    createTestCase = mod.createTestCase;
  });

  it('용량 초과 시 storage 에러를 반환한다', async () => {
    mockCheckStorageLimit.mockResolvedValue(STORAGE_ERROR);

    const result = await createTestCase({
      projectId: 'project-123',
      title: '테스트',
      caseKey: 'TC-001',
      testType: 'manual',
      tags: [],
      preCondition: '',
      testSteps: '',
      expectedResult: '',
      sortOrder: 0,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors._storage).toContain('프로젝트 저장 용량(50MB)을 초과하였습니다.');
    }
    expect(mockCheckStorageLimit).toHaveBeenCalledWith('project-123');
    // DB insert가 호출되지 않아야 한다
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('용량이 충분하면 checkStorageLimit이 null을 반환하고 진행한다', async () => {
    mockCheckStorageLimit.mockResolvedValue(null);

    await createTestCase({
      projectId: 'project-123',
      title: '테스트',
      caseKey: 'TC-001',
      testType: 'manual',
      tags: [],
      preCondition: '',
      testSteps: '',
      expectedResult: '',
      sortOrder: 0,
    });

    expect(mockCheckStorageLimit).toHaveBeenCalledWith('project-123');
    // checkStorageLimit 통과 후 DB 작업이 시도된다 (select for display_id)
    expect(mockSelect).toHaveBeenCalled();
  });
});

// ============================================================================
// updateTestCase
// ============================================================================
describe('updateTestCase - storage limit', () => {
  let updateTestCase: typeof import('@/entities/test-case/api/server-actions').updateTestCase;

  beforeEach(async () => {
    const mod = await import('@/entities/test-case/api/server-actions');
    updateTestCase = mod.updateTestCase;
  });

  it('용량 초과 시 storage 에러를 반환한다', async () => {
    mockCheckStorageLimit.mockResolvedValue(STORAGE_ERROR);

    const result = await updateTestCase({
      id: 'case-123',
      title: '수정된 제목',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors._storage).toContain('프로젝트 저장 용량(50MB)을 초과하였습니다.');
    }
    expect(mockCheckStorageLimit).toHaveBeenCalledWith('project-123');
  });
});

// ============================================================================
// createTestSuite
// ============================================================================
describe('createTestSuite - storage limit', () => {
  let createTestSuite: typeof import('@/entities/test-suite/api/server-actions').createTestSuite;

  beforeEach(async () => {
    const mod = await import('@/entities/test-suite/api/server-actions');
    createTestSuite = mod.createTestSuite;
  });

  it('용량 초과 시 storage 에러를 반환한다', async () => {
    mockCheckStorageLimit.mockResolvedValue(STORAGE_ERROR);

    const result = await createTestSuite({
      projectId: 'project-123',
      title: '테스트 스위트',
      sortOrder: 0,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors._storage).toContain('프로젝트 저장 용량(50MB)을 초과하였습니다.');
    }
    expect(mockCheckStorageLimit).toHaveBeenCalledWith('project-123');
    expect(mockInsert).not.toHaveBeenCalled();
  });
});

// ============================================================================
// createMilestone
// ============================================================================
describe('createMilestone - storage limit', () => {
  let createMilestone: typeof import('@/entities/milestone/api/server-actions').createMilestone;

  beforeEach(async () => {
    const mod = await import('@/entities/milestone/api/server-actions');
    createMilestone = mod.createMilestone;
  });

  it('용량 초과 시 storage 에러를 반환한다', async () => {
    mockCheckStorageLimit.mockResolvedValue(STORAGE_ERROR);

    const result = await createMilestone({
      projectId: 'project-123',
      title: '마일스톤',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors._storage).toContain('프로젝트 저장 용량(50MB)을 초과하였습니다.');
    }
    expect(mockCheckStorageLimit).toHaveBeenCalledWith('project-123');
    expect(mockInsert).not.toHaveBeenCalled();
  });
});

// ============================================================================
// createTestRunAction
// ============================================================================
describe('createTestRunAction - storage limit', () => {
  let createTestRunAction: typeof import('@/features/runs-create/model/server-action').createTestRunAction;

  beforeEach(async () => {
    const mod = await import('@/features/runs-create/model/server-action');
    createTestRunAction = mod.createTestRunAction;
  });

  it('용량 초과 시 storage 에러를 반환한다', async () => {
    mockCheckStorageLimit.mockResolvedValue(STORAGE_ERROR);

    const result = await createTestRunAction({
      project_id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test Run',
      milestone_ids: ['770e8400-e29b-41d4-a716-446655440001'],
    });

    expect(result.success).toBe(false);
    if (!result.success && '_storage' in result.errors) {
      expect(result.errors._storage).toContain('프로젝트 저장 용량(50MB)을 초과하였습니다.');
    }
    expect(mockCheckStorageLimit).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000');
  });
});
