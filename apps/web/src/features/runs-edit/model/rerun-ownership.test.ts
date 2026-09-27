import { beforeEach, describe, expect, it, vi } from 'vitest';

import { rerunTestRunAction } from './rerun-test-run';

/** 재실행이 원본의 다른 프로젝트 연결을 복제하지 않는지 검증 (#311 후속). */

const RUN_ID = '0199a000-0000-7000-8000-000000000001';
const PROJECT_ID = '0199a000-0000-7000-8000-0000000000aa';
const CASE_ID = '0199a000-0000-7000-8000-00000000000a';
const SUITE_ID = '0199a000-0000-7000-8000-00000000000b';

const mocks = vi.hoisted(() => ({
  requireAccess: vi.fn(async () => true),
  assertResources: vi.fn(async () => undefined),
  transaction: vi.fn(async () => ({ id: 'new-run' })),
  /** where() 결과를 호출 순서대로 돌려준다. */
  whereQueue: [] as unknown[][],
}));

vi.mock('server-only', () => ({}));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/shared/lib/cache/tags', () => ({ INVALIDATE: {}, invalidateCache: vi.fn() }));
vi.mock('@/access/lib/require-access', () => ({ requireProjectAccess: mocks.requireAccess }));
vi.mock('@/entities/test-run/api/assert-run-resources', () => ({
  assertRunResources: mocks.assertResources,
}));

vi.mock('@testea/db', () => {
  const chain: Record<string, unknown> = {};
  chain.from = () => chain;
  chain.where = () => Object.assign(Promise.resolve(mocks.whereQueue.shift() ?? []), chain);
  chain.limit = () =>
    Promise.resolve([{ id: RUN_ID, project_id: PROJECT_ID, milestone_id: null, name: 'r' }]);
  return {
    getDatabase: () => ({ select: () => chain, transaction: mocks.transaction }),
    testRuns: {},
    testCaseRuns: {},
    testCases: {},
    testRunSuites: {},
    testRunMilestones: {},
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAccess.mockResolvedValue(true);
  mocks.assertResources.mockResolvedValue(undefined);
  mocks.whereQueue.length = 0;
  mocks.whereQueue.push(
    [], // 원본 실행 조회(.limit 으로 대체)
    [{ test_case_id: CASE_ID, source_type: 'adhoc', source_id: null }], // 원본 케이스 실행
    [{ id: CASE_ID }], // 활성 케이스
    [{ test_suite_id: SUITE_ID }], // 스위트 연결
    [] // 마일스톤 연결
  );
});

describe('rerunTestRunAction 프로젝트 경계', () => {
  it('원본에 다른 프로젝트 리소스가 연결돼 있으면 새 실행을 만들지 않는다', async () => {
    mocks.assertResources.mockRejectedValueOnce(new Error('mismatch'));
    const result = await rerunTestRunAction(RUN_ID);
    expect(result.success).toBe(false);
    // 빈 케이스로 조기 종료한 것이 아니라 소유 검사까지 도달했는지 확인한다.
    expect(mocks.assertResources).toHaveBeenCalledWith(expect.anything(), PROJECT_ID, {
      suiteIds: [SUITE_ID],
      milestoneIds: [],
      caseIds: [CASE_ID],
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('연결이 모두 같은 프로젝트면 새 실행을 만든다', async () => {
    const result = await rerunTestRunAction(RUN_ID);
    expect(result.success).toBe(true);
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
  });
});
