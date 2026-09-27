import { beforeEach, describe, expect, it, vi } from 'vitest';

import { addCasesToRunAction } from './add-cases-to-run';
import { addMilestonesToRunAction } from './add-milestones-to-run';
import { addSuitesToRunAction } from './add-suites-to-run';
import { rerunTestRunAction } from './rerun-test-run';

/**
 * 실행 연결 액션의 프로젝트 경계 검증 (#311).
 * 무인증·다른 프로젝트·섞인 ID·잘못된 입력이면 트랜잭션(=DB 쓰기)에 들어가지 않아야 한다.
 */

const RUN_ID = '0199a000-0000-7000-8000-000000000001';
const PROJECT_ID = '0199a000-0000-7000-8000-0000000000aa';
const ID_A = '0199a000-0000-7000-8000-00000000000a';
const ID_B = '0199a000-0000-7000-8000-00000000000b';

const mocks = vi.hoisted(() => ({
  requireAccess: vi.fn(async () => true),
  allBelong: vi.fn(async () => true),
  runRow: vi.fn(() => [{ projectId: '0199a000-0000-7000-8000-0000000000aa' }]),
  transaction: vi.fn(async () => 0),
  /** where() 결과를 호출 순서대로 돌려준다. 비면 []. */
  whereQueue: [] as unknown[][],
}));

vi.mock('server-only', () => ({}));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/shared/lib/cache/tags', () => ({ INVALIDATE: {}, invalidateCache: vi.fn() }));
vi.mock('@/access/lib/require-access', () => ({ requireProjectAccess: mocks.requireAccess }));
vi.mock('@/access/lib/project-scope', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/access/lib/project-scope')>()),
  allBelongToProject: mocks.allBelong,
}));

// select().from().where().limit() 는 실행 조회. 그 외 체인은 빈 배열.
function selectChain() {
  const chain: Record<string, unknown> = {};
  const end = () => chain;
  chain.from = end;
  chain.innerJoin = end;
  chain.where = vi.fn(() => Object.assign(Promise.resolve(mocks.whereQueue.shift() ?? []), chain));
  chain.limit = () => Promise.resolve(mocks.runRow());
  return chain;
}

vi.mock('@testea/db', () => ({
  getDatabase: () => ({
    select: () => selectChain(),
    transaction: mocks.transaction,
  }),
  testRuns: { id: 'id', project_id: 'project_id' },
  testCaseRuns: {},
  testCases: {},
  testRunSuites: {},
  testRunMilestones: {},
  milestoneTestCases: {},
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAccess.mockResolvedValue(true);
  mocks.allBelong.mockResolvedValue(true);
  mocks.runRow.mockReturnValue([{ projectId: PROJECT_ID }]);
  mocks.transaction.mockResolvedValue(0);
  mocks.whereQueue.length = 0;
});

const linkActions = [
  ['addSuitesToRunAction', addSuitesToRunAction, 'testSuite'],
  ['addCasesToRunAction', addCasesToRunAction, 'testCase'],
  ['addMilestonesToRunAction', addMilestonesToRunAction, 'milestone'],
] as const;

describe.each(linkActions)('%s 프로젝트 경계', (_name, action, kind) => {
  it('무인증이면 DB 에 쓰지 않고 거부한다', async () => {
    mocks.requireAccess.mockResolvedValueOnce(false);
    const result = await action(RUN_ID, [ID_A]);
    expect(result.success).toBe(false);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('실행이 없으면 거부한다', async () => {
    mocks.runRow.mockReturnValueOnce([]);
    const result = await action(RUN_ID, [ID_A]);
    expect(result.success).toBe(false);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('다른 프로젝트·없는 ID 가 하나라도 섞이면 통째로 거부한다', async () => {
    mocks.allBelong.mockResolvedValueOnce(false);
    const result = await action(RUN_ID, [ID_A, ID_B]);
    expect(result.success).toBe(false);
    expect(mocks.allBelong).toHaveBeenCalledWith(kind, [ID_A, ID_B], PROJECT_ID);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('UUID 가 아닌 입력은 소유 조회 전에 거부한다', async () => {
    const result = await action(RUN_ID, ['not-a-uuid']);
    expect(result.success).toBe(false);
    expect(mocks.allBelong).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('모두 같은 프로젝트 소속이면 연결을 진행한다 (중복 ID 는 합친다)', async () => {
    const result = await action(RUN_ID, [ID_A, ID_A]);
    expect(result.success).toBe(true);
    expect(mocks.allBelong).toHaveBeenCalledWith(kind, [ID_A], PROJECT_ID);
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
  });
});

describe('rerunTestRunAction 프로젝트 경계', () => {
  it('원본 실행에 다른 프로젝트 스위트·마일스톤이 연결돼 있으면 새 실행을 만들지 않는다', async () => {
    // 원본 실행 조회는 select().from().where().limit() 경로다. 전체 행을 돌려준다.
    mocks.runRow.mockReturnValueOnce([
      { id: RUN_ID, project_id: PROJECT_ID, milestone_id: null, name: 'r' },
    ]);
    // 원본 조회 체인: select().from().where().limit() 가 첫 where 를 소비하므로 빈 결과를 앞에 둔다.
    mocks.whereQueue.push(
      [], // 원본 실행 조회(.limit 으로 대체됨)
      [{ test_case_id: ID_A, source_type: 'adhoc', source_id: null }], // 원본 케이스 실행
      [{ id: ID_A }], // 활성 케이스
      [{ test_suite_id: ID_B }], // 스위트 연결
      [] // 마일스톤 연결
    );
    mocks.allBelong.mockResolvedValueOnce(false);
    const result = await rerunTestRunAction(RUN_ID);
    expect(result.success).toBe(false);
    // 소유 관계 검사까지 실제로 도달했는지 확인한다(빈 케이스로 조기 종료한 것이 아님).
    expect(mocks.allBelong).toHaveBeenCalledWith('testSuite', [ID_B], PROJECT_ID);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
