import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createTestCase, updateTestCase } from './server-actions';

/**
 * 케이스에 붙이는 스위트·섹션의 프로젝트 경계 검증 (#336).
 * 스위트에 연결된 실행으로 케이스가 곧바로 동기화되므로, 다른 프로젝트 ID 는 쓰기 전에 거부해야 한다.
 */

const PROJECT_A = '0199a000-0000-7000-8000-0000000000aa';
const PROJECT_B = '0199a000-0000-7000-8000-0000000000bb';
const CASE_ID = '0199a000-0000-7000-8000-0000000000c1';
const SUITE_ID = '0199a000-0000-7000-8000-0000000000d1';
const SECTION_ID = '0199a000-0000-7000-8000-0000000000e1';

const mocks = vi.hoisted(() => ({
  owners: new Map<string, string>(),
  transaction: vi.fn(),
  update: vi.fn(),
}));

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/shared/lib/cache/tags', () => ({ INVALIDATE: {}, invalidateCache: vi.fn() }));
vi.mock('@/access/lib/require-access', () => ({ requireProjectAccess: vi.fn(async () => true) }));
vi.mock('@/shared/lib/storage/check-storage-limit', () => ({
  checkStorageLimit: vi.fn(async () => null),
}));
vi.mock('@/entities/test-case-version/api/create-version-snapshot', () => ({
  createVersionSnapshot: vi.fn(async () => undefined),
}));
vi.mock('@/access/lib/project-scope', () => ({
  ACCESS_DENIED: { success: false, errors: { _general: ['접근 권한이 없습니다.'] } },
  canAccess: vi.fn(async () => true),
  belongsToProject: vi.fn(
    async (_kind: string, id: string, projectId: string) => mocks.owners.get(id) === projectId
  ),
}));

vi.mock('@testea/db', () => {
  const chain: Record<string, unknown> = {};
  chain.from = () => chain;
  chain.where = () => chain;
  chain.limit = async () => [{ id: '0199a000-0000-7000-8000-0000000000c1', project_id: PROJECT_A }];
  return {
    getDatabase: () => ({
      select: () => chain,
      transaction: mocks.transaction,
      update: mocks.update,
    }),
    milestoneTestSuites: {},
    testCaseRuns: {},
    testCases: {},
    testRunSuites: {},
    testRuns: {},
  };
});

const baseInput = {
  projectId: PROJECT_A,
  caseKey: 'TC-001',
  title: '케이스',
  testType: 'manual',
  tags: [],
  preCondition: '',
  testSteps: '',
  expectedResult: '',
  sortOrder: 1,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.owners.clear();
  // 쓰기 단계까지 오면 의도적으로 실패시켜, 거부 전에 쓰기가 일어났는지만 본다.
  mocks.transaction.mockRejectedValue(new Error('write reached'));
  mocks.update.mockImplementation(() => {
    throw new Error('write reached');
  });
});

describe('createTestCase 스위트·섹션 프로젝트 경계', () => {
  it('다른 프로젝트 스위트면 쓰기 없이 거부한다', async () => {
    mocks.owners.set(SUITE_ID, PROJECT_B);
    const result = await createTestCase({ ...baseInput, testSuiteId: SUITE_ID });
    expect(result.success).toBe(false);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('없는 스위트면 쓰기 없이 거부한다', async () => {
    const result = await createTestCase({ ...baseInput, testSuiteId: SUITE_ID });
    expect(result.success).toBe(false);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('다른 프로젝트 섹션이면 쓰기 없이 거부한다', async () => {
    mocks.owners.set(SUITE_ID, PROJECT_A);
    mocks.owners.set(SECTION_ID, PROJECT_B);
    const result = await createTestCase({
      ...baseInput,
      testSuiteId: SUITE_ID,
      sectionId: SECTION_ID,
    });
    expect(result.success).toBe(false);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('같은 프로젝트 스위트·섹션이면 생성 단계로 진행한다', async () => {
    mocks.owners.set(SUITE_ID, PROJECT_A);
    mocks.owners.set(SECTION_ID, PROJECT_A);
    await createTestCase({ ...baseInput, testSuiteId: SUITE_ID, sectionId: SECTION_ID });
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
  });

  it('스위트 없이 만들면 소속 확인 없이 생성 단계로 진행한다', async () => {
    await createTestCase(baseInput);
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
  });
});

describe('updateTestCase 스위트·섹션 프로젝트 경계', () => {
  it('다른 프로젝트 스위트로 옮기려 하면 쓰기 없이 거부한다', async () => {
    mocks.owners.set(SUITE_ID, PROJECT_B);
    const result = await updateTestCase({ id: CASE_ID, testSuiteId: SUITE_ID });
    expect(result.success).toBe(false);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('다른 프로젝트 섹션으로 옮기려 하면 쓰기 없이 거부한다', async () => {
    mocks.owners.set(SECTION_ID, PROJECT_B);
    const result = await updateTestCase({ id: CASE_ID, sectionId: SECTION_ID });
    expect(result.success).toBe(false);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('같은 프로젝트 스위트면 수정 단계로 진행한다', async () => {
    mocks.owners.set(SUITE_ID, PROJECT_A);
    await updateTestCase({ id: CASE_ID, testSuiteId: SUITE_ID });
    expect(mocks.update).toHaveBeenCalled();
  });

  it('스위트 해제(null)는 소속 확인 없이 수정 단계로 진행한다', async () => {
    await updateTestCase({ id: CASE_ID, testSuiteId: null });
    expect(mocks.update).toHaveBeenCalled();
  });
});
