import { beforeEach, describe, expect, it, vi } from 'vitest';

import { rerunTestRunAction } from './rerun-test-run';

/** 재실행이 원본의 다른 프로젝트 연결을 복제하지 않는지 검증 (#311 후속). */

const RUN_ID = '0199a000-0000-7000-8000-000000000001';
const PROJECT_ID = '0199a000-0000-7000-8000-0000000000aa';
const CASE_ID = '0199a000-0000-7000-8000-00000000000a';
const SUITE_ID = '0199a000-0000-7000-8000-00000000000b';
const CASE_ID_2 = '0199a000-0000-7000-8000-00000000000c';
const CASE_RUN_1 = '0199a000-0000-7000-8000-000000000101';
const CASE_RUN_2 = '0199a000-0000-7000-8000-000000000102';
const OTHER_CASE_RUN = '0199a000-0000-7000-8000-000000000199';

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
    [
      { id: CASE_RUN_1, test_case_id: CASE_ID, source_type: 'adhoc', source_id: null },
      { id: CASE_RUN_2, test_case_id: CASE_ID_2, source_type: 'adhoc', source_id: null },
    ], // 원본 케이스 실행
    [{ id: CASE_ID }, { id: CASE_ID_2 }], // 활성 케이스
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
      caseIds: [CASE_ID, CASE_ID_2],
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('연결이 모두 같은 프로젝트면 새 실행을 만든다', async () => {
    const result = await rerunTestRunAction(RUN_ID);
    expect(result.success).toBe(true);
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
  });
});

/** 트랜잭션 안에서 넣은 값을 모은다. */
const captureInserts = () => {
  const inserted: unknown[] = [];
  const tx = {
    insert: () => ({
      values: (v: unknown) => {
        inserted.push(v);
        return {
          returning: async () => [{ id: 'new-run' }],
          onConflictDoNothing: () => ({ returning: async () => [] }),
        };
      },
    }),
  };
  mocks.transaction.mockImplementationOnce(async (cb: (t: typeof tx) => unknown) => cb(tx));
  return inserted;
};

describe('rerunTestRunAction 골라 만들기 (06j)', () => {
  it('고른 케이스만 담고 이름을 쓰며 범위를 고정한다', async () => {
    const inserted = captureInserts();
    const result = await rerunTestRunAction(RUN_ID, {
      name: ' 회귀 - 3차 ',
      testCaseRunIds: [CASE_RUN_2],
    });
    expect(result.success).toBe(true);
    const [run, ...rest] = inserted as Record<string, unknown>[];
    expect(run).toMatchObject({ name: '회귀 - 3차', scope_locked_at: expect.any(Date) });
    // 스위트 링크는 복제하지 않고 케이스만 넣는다.
    expect(rest).toHaveLength(1);
    expect(rest[0]).toEqual([expect.objectContaining({ test_case_id: CASE_ID_2 })]);
  });

  it('전부 고르면 범위를 고정하지 않고 스위트 링크도 복제한다', async () => {
    const inserted = captureInserts();
    await rerunTestRunAction(RUN_ID, { testCaseRunIds: [CASE_RUN_1, CASE_RUN_2] });
    const [run, suites] = inserted as Record<string, unknown>[];
    expect(run).toMatchObject({ scope_locked_at: null });
    expect(suites).toEqual([expect.objectContaining({ test_suite_id: SUITE_ID })]);
  });

  it('다른 실행의 결과 ID 가 섞이면 만들지 않는다', async () => {
    const result = await rerunTestRunAction(RUN_ID, {
      testCaseRunIds: [CASE_RUN_1, OTHER_CASE_RUN],
    });
    expect(result.success).toBe(false);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('이름이 너무 짧으면 만들지 않는다', async () => {
    const result = await rerunTestRunAction(RUN_ID, { name: ' a ' });
    expect(result.success).toBe(false);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
