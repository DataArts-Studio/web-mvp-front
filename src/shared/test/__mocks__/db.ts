import { CreateMilestone, MilestoneDTO } from '@/entities/milestone';
import { type Mock, vi } from 'vitest';

// ============================================================================
// Types
// ============================================================================
export type LifecycleStatus = 'ACTIVE' | 'ARCHIVED' | 'DELETED';
export type TestCaseResultStatus = 'untested' | 'pass' | 'fail' | 'blocked';
export type TestRunStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
export type MilestoneProgressStatus = 'planned' | 'in_progress' | 'completed';

// ============================================================================
// Mock Return Values
// ============================================================================
let mockReturnValue: unknown = [];
let mockInsertReturnValue: unknown = undefined;
let mockUpdateReturnValue: unknown = undefined;
let mockDeleteReturnValue: unknown = undefined;

// ============================================================================
// Mock Database Object
// ============================================================================
export const mockDb: any = {
  select: vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => ({
        limit: vi.fn(() => ({
          offset: vi.fn(() => Promise.resolve(mockReturnValue)),
        })),
        then: (resolve: (value: unknown) => void) => Promise.resolve(mockReturnValue).then(resolve),
      })),
      limit: vi.fn(() => ({
        offset: vi.fn(() => Promise.resolve(mockReturnValue)),
      })),
      orderBy: vi.fn(() => ({
        limit: vi.fn(() => ({
          offset: vi.fn(() => Promise.resolve(mockReturnValue)),
        })),
        then: (resolve: (value: unknown) => void) => Promise.resolve(mockReturnValue).then(resolve),
      })),
      then: (resolve: (value: unknown) => void) => Promise.resolve(mockReturnValue).then(resolve),
    })),
  })),
  insert: vi.fn(() => ({
    values: vi.fn(() => ({
      returning: vi.fn(() => Promise.resolve(mockInsertReturnValue ? [mockInsertReturnValue] : [])),
      onConflictDoNothing: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve(mockInsertReturnValue ? [mockInsertReturnValue] : [])),
      })),
    })),
  })),
  update: vi.fn(() => ({
    set: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve(mockUpdateReturnValue ? [mockUpdateReturnValue] : [])),
      })),
    })),
  })),
  delete: vi.fn(() => ({
    where: vi.fn(() => ({
      returning: vi.fn(() => Promise.resolve(mockDeleteReturnValue ? [mockDeleteReturnValue] : [])),
      then: (resolve: (value: unknown) => void) => Promise.resolve(mockDeleteReturnValue).then(resolve),
    })),
  })),
};

export const mockGetDatabase: Mock<any> = vi.fn(() => mockDb);

// ============================================================================
// Mock Helper Functions
// ============================================================================
export const setMockSelectReturn = (value: unknown) => {
  mockReturnValue = value;
};

export const setMockInsertReturn = (value: unknown) => {
  mockInsertReturnValue = value;
};

export const setMockUpdateReturn = (value: unknown) => {
  mockUpdateReturnValue = value;
};

export const setMockDeleteReturn = (value: unknown) => {
  mockDeleteReturnValue = value;
};

export const resetMockDb = () => {
  mockReturnValue = [];
  mockInsertReturnValue = undefined;
  mockUpdateReturnValue = undefined;
  mockDeleteReturnValue = undefined;
  vi.clearAllMocks();
};

// ============================================================================
// Project Fixtures
// ============================================================================
export const createMockProjectRow = (
  overrides: Partial<{
    id: string;
    name: string;
    slug: string;
    identifier: string;
    description: string | null;
    owner_name: string | null;
    created_at: Date;
    updated_at: Date;
    archived_at: Date | null;
    lifecycle_status: LifecycleStatus;
  }> = {}
) => ({
  id: overrides.id ?? 'project-123',
  name: overrides.name ?? '테스트 프로젝트',
  slug: overrides.slug ?? 'test-project',
  identifier: overrides.identifier ?? 'TPJ',
  description: overrides.description ?? '테스트 프로젝트 설명입니다.',
  owner_name: overrides.owner_name ?? '관리자',
  created_at: overrides.created_at ?? new Date('2024-01-01'),
  updated_at: overrides.updated_at ?? new Date('2024-01-01'),
  archived_at: overrides.archived_at ?? null,
  lifecycle_status: overrides.lifecycle_status ?? 'ACTIVE',
});

export const createMockCreateProjectInput = (
  overrides: Partial<{
    name: string;
    identifier: string;
    description: string;
    ownerName: string;
  }> = {}
) => ({
  name: overrides.name ?? '테스트 프로젝트',
  identifier: overrides.identifier ?? 'TPJ',
  description: overrides.description ?? '테스트 프로젝트 설명입니다.',
  ownerName: overrides.ownerName ?? '관리자',
});

// ============================================================================
// Test Suite Fixtures
// ============================================================================
export const createMockTestSuiteRow = (
  overrides: Partial<{
    id: string;
    project_id: string;
    name: string;
    description: string | null;
    sort_order: number | null;
    created_at: Date;
    updated_at: Date;
    archived_at: Date | null;
    lifecycle_status: LifecycleStatus;
  }> = {}
) => ({
  id: overrides.id ?? '01234567-89ab-cdef-0123-456789abcdef',
  project_id: overrides.project_id ?? 'project-123',
  name: overrides.name ?? '테스트 스위트 제목입니다',
  description: 'description' in overrides ? overrides.description : '테스트 설명',
  sort_order: 'sort_order' in overrides ? overrides.sort_order : 0,
  created_at: overrides.created_at ?? new Date('2024-01-01'),
  updated_at: overrides.updated_at ?? new Date('2024-01-01'),
  archived_at: 'archived_at' in overrides ? overrides.archived_at : null,
  lifecycle_status: overrides.lifecycle_status ?? 'ACTIVE',
});

export const createMockCreateTestSuiteInput = (
  overrides: Partial<{
    projectId: string;
    title: string;
    description: string;
    sortOrder: number;
  }> = {}
) => ({
  projectId: overrides.projectId ?? 'project-123',
  title: overrides.title ?? '테스트 스위트 제목입니다',
  description: overrides.description ?? '테스트 설명',
  sortOrder: overrides.sortOrder ?? 0,
});

// ============================================================================
// Test Case Fixtures
// ============================================================================
export const createMockTestCaseRow = (
  overrides: Partial<{
    id: string;
    project_id: string;
    name: string;
    steps: string | null;
    test_type: string | null;
    case_key: string | null;
    pre_condition: string | null;
    tags: string[] | null;
    expected_result: string | null;
    sort_order: number | null;
    result_status: TestCaseResultStatus;
    created_at: Date;
    updated_at: Date;
    archived_at: Date | null;
    lifecycle_status: LifecycleStatus;
  }> = {}
) => ({
  id: overrides.id ?? 'test-case-123',
  project_id: overrides.project_id ?? 'project-123',
  name: overrides.name ?? '테스트 케이스 제목',
  steps: 'steps' in overrides ? overrides.steps : '1. 첫 번째 단계\n2. 두 번째 단계',
  test_type: overrides.test_type ?? 'functional',
  case_key: overrides.case_key ?? 'TC-001',
  pre_condition: 'pre_condition' in overrides ? overrides.pre_condition : '사전 조건 설명',
  tags: overrides.tags ?? ['태그1', '태그2'],
  expected_result: 'expected_result' in overrides ? overrides.expected_result : '예상 결과 설명',
  sort_order: 'sort_order' in overrides ? overrides.sort_order : 0,
  result_status: overrides.result_status ?? 'untested',
  created_at: overrides.created_at ?? new Date('2024-01-01'),
  updated_at: overrides.updated_at ?? new Date('2024-01-01'),
  archived_at: 'archived_at' in overrides ? overrides.archived_at : null,
  lifecycle_status: overrides.lifecycle_status ?? 'ACTIVE',
});

export const createMockCreateTestCaseInput = (
  overrides: Partial<{
    projectId: string;
    testSuiteId: string;
    caseKey: string;
    title: string;
    testType: string;
    tags: string[];
    preCondition: string;
    testSteps: string;
    expectedResult: string;
    sortOrder: number;
  }> = {}
) => ({
  projectId: overrides.projectId ?? 'project-123',
  testSuiteId: overrides.testSuiteId ?? 'suite-123',
  caseKey: overrides.caseKey ?? 'TC-001',
  title: overrides.title ?? '테스트 케이스 제목',
  testType: overrides.testType ?? 'functional',
  tags: overrides.tags ?? ['태그1', '태그2'],
  preCondition: overrides.preCondition ?? '사전 조건 설명',
  testSteps: overrides.testSteps ?? '1. 첫 번째 단계\n2. 두 번째 단계',
  expectedResult: overrides.expectedResult ?? '예상 결과 설명',
  sortOrder: overrides.sortOrder ?? 0,
});

// ============================================================================
// Test Run Fixtures
// ============================================================================
export const createMockTestRunRow = (
  overrides: Partial<{
    id: string;
    project_id: string;
    name: string;
    description: string | null;
    status: TestRunStatus;
    created_at: Date;
    updated_at: Date;
    archived_at: Date | null;
    lifecycle_status: LifecycleStatus;
  }> = {}
) => ({
  id: overrides.id ?? 'test-run-123',
  project_id: overrides.project_id ?? 'project-123',
  name: overrides.name ?? '테스트 실행',
  description: 'description' in overrides ? overrides.description : '테스트 실행 설명입니다.',
  status: overrides.status ?? 'NOT_STARTED',
  created_at: overrides.created_at ?? new Date('2024-01-01'),
  updated_at: overrides.updated_at ?? new Date('2024-01-01'),
  archived_at: 'archived_at' in overrides ? overrides.archived_at : null,
  lifecycle_status: overrides.lifecycle_status ?? 'ACTIVE',
});

export const createMockCreateTestRunInput = (
  overrides: Partial<{
    projectId: string;
    name: string;
    description: string;
    suiteIds: string[];
    milestoneIds: string[];
  }> = {}
) => ({
  projectId: overrides.projectId ?? 'project-123',
  name: overrides.name ?? '테스트 실행',
  description: overrides.description ?? '테스트 실행 설명입니다.',
  suiteIds: overrides.suiteIds ?? [],
  milestoneIds: overrides.milestoneIds ?? [],
});

// ============================================================================
// Milestone Fixtures
// ============================================================================
export const createMockMilestoneRow = (overrides?: Partial<MilestoneDTO>): MilestoneDTO => ({
  id: 'milestone-123',
  project_id: 'project-123',
  name: '테스트 마일스톤',
  description: '테스트용 마일스톤 설명입니다.',
  start_date: '2024-01-01',
  end_date: '2024-12-31',
  progress_status: 'planned',
  created_at: new Date(),
  updated_at: new Date(),
  archived_at: null,
  lifecycle_status: 'ACTIVE',
  ...overrides,
});

export const createMockCreateMilestoneInput = (
  overrides?: Partial<CreateMilestone>
): CreateMilestone => ({
  projectId: 'project-123',
  title: '테스트 마일스톤',
  description: '테스트용 마일스톤 설명입니다.',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  ...overrides,
});

// ============================================================================
// Test Case Run (Execution Result) Fixtures
// ============================================================================
export const createMockTestCaseRunRow = (
  overrides: Partial<{
    id: string;
    test_run_id: string;
    test_case_id: string;
    status: TestCaseResultStatus;
    comment: string | null;
    executed_at: Date | null;
    created_at: Date;
    updated_at: Date;
  }> = {}
) => ({
  id: overrides.id ?? 'test-case-run-123',
  test_run_id: overrides.test_run_id ?? 'test-run-123',
  test_case_id: overrides.test_case_id ?? 'test-case-123',
  status: overrides.status ?? 'untested',
  comment: 'comment' in overrides ? overrides.comment : null,
  executed_at: 'executed_at' in overrides ? overrides.executed_at : null,
  created_at: overrides.created_at ?? new Date('2024-01-01'),
  updated_at: overrides.updated_at ?? new Date('2024-01-01'),
});

// ============================================================================
// Junction Table Fixtures
// ============================================================================

/** Suite-TestCase 연결 테이블 */
export const createMockSuiteTestCaseRow = (
  overrides: Partial<{
    suite_id: string;
    test_case_id: string;
  }> = {}
) => ({
  suite_id: overrides.suite_id ?? 'suite-123',
  test_case_id: overrides.test_case_id ?? 'test-case-123',
});

/** TestRun-Milestone 연결 테이블 */
export const createMockTestRunMilestoneRow = (
  overrides: Partial<{
    test_run_id: string;
    milestone_id: string;
  }> = {}
) => ({
  test_run_id: overrides.test_run_id ?? 'test-run-123',
  milestone_id: overrides.milestone_id ?? 'milestone-123',
});

/** TestRun-Suite 연결 테이블 */
export const createMockTestRunSuiteRow = (
  overrides: Partial<{
    test_run_id: string;
    test_suite_id: string;
  }> = {}
) => ({
  test_run_id: overrides.test_run_id ?? 'test-run-123',
  test_suite_id: overrides.test_suite_id ?? 'suite-123',
});

/** Milestone-TestCase 연결 테이블 */
export const createMockMilestoneTestCaseRow = (
  overrides: Partial<{
    milestone_id: string;
    test_case_id: string;
  }> = {}
) => ({
  milestone_id: overrides.milestone_id ?? 'milestone-123',
  test_case_id: overrides.test_case_id ?? 'test-case-123',
});

// ============================================================================
// Batch/List Helpers
// ============================================================================

/** 여러 개의 Project Row 생성 */
export const createMockProjectRows = (count: number, baseOverrides?: Parameters<typeof createMockProjectRow>[0]) =>
  Array.from({ length: count }, (_, i) =>
    createMockProjectRow({
      id: `project-${i + 1}`,
      name: `테스트 프로젝트 ${i + 1}`,
      slug: `test-project-${i + 1}`,
      ...baseOverrides,
    })
  );

/** 여러 개의 TestSuite Row 생성 */
export const createMockTestSuiteRows = (count: number, baseOverrides?: Parameters<typeof createMockTestSuiteRow>[0]) =>
  Array.from({ length: count }, (_, i) =>
    createMockTestSuiteRow({
      id: `suite-${i + 1}`,
      name: `테스트 스위트 ${i + 1}`,
      sort_order: i,
      ...baseOverrides,
    })
  );

/** 여러 개의 TestCase Row 생성 */
export const createMockTestCaseRows = (count: number, baseOverrides?: Parameters<typeof createMockTestCaseRow>[0]) =>
  Array.from({ length: count }, (_, i) =>
    createMockTestCaseRow({
      id: `test-case-${i + 1}`,
      name: `테스트 케이스 ${i + 1}`,
      case_key: `TC-${String(i + 1).padStart(3, '0')}`,
      sort_order: i,
      ...baseOverrides,
    })
  );

/** 여러 개의 TestRun Row 생성 */
export const createMockTestRunRows = (count: number, baseOverrides?: Parameters<typeof createMockTestRunRow>[0]) =>
  Array.from({ length: count }, (_, i) =>
    createMockTestRunRow({
      id: `test-run-${i + 1}`,
      name: `테스트 실행 ${i + 1}`,
      ...baseOverrides,
    })
  );

/** 여러 개의 Milestone Row 생성 */
export const createMockMilestoneRows = (count: number, baseOverrides?: Partial<MilestoneDTO>) =>
  Array.from({ length: count }, (_, i) =>
    createMockMilestoneRow({
      id: `milestone-${i + 1}`,
      name: `마일스톤 ${i + 1}`,
      ...baseOverrides,
    })
  );

/** 여러 개의 TestCaseRun Row 생성 */
export const createMockTestCaseRunRows = (
  count: number,
  baseOverrides?: Parameters<typeof createMockTestCaseRunRow>[0]
) =>
  Array.from({ length: count }, (_, i) =>
    createMockTestCaseRunRow({
      id: `test-case-run-${i + 1}`,
      test_case_id: `test-case-${i + 1}`,
      ...baseOverrides,
    })
  );
