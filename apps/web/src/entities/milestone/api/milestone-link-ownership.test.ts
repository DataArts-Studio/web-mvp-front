import { beforeEach, describe, expect, it, vi } from 'vitest';

import { addTestCasesToMilestone, addTestSuitesToMilestone } from './server-actions';

/**
 * 마일스톤에 케이스·스위트를 붙이는 액션의 프로젝트 경계 검증 (#311).
 * 마일스톤에 붙은 항목은 연결된 실행으로 곧바로 동기화되므로, 섞인 ID 는 쓰기 전에 거부해야 한다.
 */

const MILESTONE_ID = '0199a000-0000-7000-8000-0000000000m1';
const PROJECT_ID = '0199a000-0000-7000-8000-0000000000aa';
const ID_A = '0199a000-0000-7000-8000-00000000000a';
const ID_B = '0199a000-0000-7000-8000-00000000000b';

const mocks = vi.hoisted(() => ({
  requireAccess: vi.fn(async () => true),
  allBelong: vi.fn(async () => true),
  insert: vi.fn(() => ({ values: () => ({ onConflictDoNothing: async () => undefined }) })),
}));

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/shared/lib/cache/tags', () => ({ INVALIDATE: {}, invalidateCache: vi.fn() }));
vi.mock('@/access/lib/require-access', () => ({ requireProjectAccess: mocks.requireAccess }));
vi.mock('@/access/lib/project-scope', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/access/lib/project-scope')>()),
  allBelongToProject: mocks.allBelong,
}));

vi.mock('@testea/db', () => {
  const chain: Record<string, unknown> = {};
  chain.from = () => chain;
  chain.where = () => Object.assign(Promise.resolve([]), chain);
  chain.limit = () => Promise.resolve([{ projectId: '0199a000-0000-7000-8000-0000000000aa' }]);
  return {
    getDatabase: () => ({ select: () => chain, insert: mocks.insert }),
    milestones: { id: 'id', project_id: 'project_id' },
    milestoneTestCases: {},
    milestoneTestSuites: {},
    testRuns: {},
    testCaseRuns: {},
    testCases: {},
    testRunSuites: {},
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAccess.mockResolvedValue(true);
  mocks.allBelong.mockResolvedValue(true);
});

describe.each([
  ['addTestCasesToMilestone', addTestCasesToMilestone, 'testCase'],
  ['addTestSuitesToMilestone', addTestSuitesToMilestone, 'testSuite'],
] as const)('%s 프로젝트 경계', (_name, action, kind) => {
  it('다른 프로젝트·없는 ID 가 섞이면 쓰기 없이 거부한다', async () => {
    mocks.allBelong.mockResolvedValueOnce(false);
    const result = await action(MILESTONE_ID, [ID_A, ID_B]);
    expect(result.success).toBe(false);
    expect(mocks.allBelong).toHaveBeenCalledWith(kind, [ID_A, ID_B], PROJECT_ID);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it('무인증이면 소유 조회·쓰기 없이 거부한다', async () => {
    mocks.requireAccess.mockResolvedValueOnce(false);
    const result = await action(MILESTONE_ID, [ID_A]);
    expect(result.success).toBe(false);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it('UUID 가 아니거나 빈 배열이면 거부한다', async () => {
    expect((await action(MILESTONE_ID, ['bad'])).success).toBe(false);
    expect((await action(MILESTONE_ID, [])).success).toBe(false);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it('모두 같은 프로젝트면 연결한다', async () => {
    const result = await action(MILESTONE_ID, [ID_A]);
    expect(result.success).toBe(true);
    expect(mocks.insert).toHaveBeenCalled();
  });
});
