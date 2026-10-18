import { beforeEach, describe, expect, it, vi } from 'vitest';

import { recordCreatedCases } from './record-created-cases';

const { createInitialVersions, lockSuiteRunSync, recomputeTestRunStatus, tables } = vi.hoisted(
  () => ({
    createInitialVersions: vi.fn(async () => undefined),
    lockSuiteRunSync: vi.fn(async () => undefined),
    recomputeTestRunStatus: vi.fn(async () => undefined),
    tables: {
      testRunSuites: {
        name: 'test_run_suites',
        test_run_id: 'trs.run',
        test_suite_id: 'trs.suite',
      },
      milestoneTestSuites: { name: 'milestone_test_suites', milestone_id: 'mts.milestone' },
      testRuns: { name: 'test_runs', id: 'tr.id', milestone_id: 'tr.milestone' },
      testCaseRuns: { name: 'test_case_runs', test_run_id: 'tcr.run', test_case_id: 'tcr.case' },
      testCases: {},
    },
  })
);

vi.mock('server-only', () => ({}));
vi.mock('@/entities/test-case-version/api/create-version-snapshot', () => ({
  createInitialVersions,
}));
vi.mock('@/entities/test-run/api/run-scope', () => ({ lockSuiteRunSync, recomputeTestRunStatus }));
vi.mock('@testea/db', () => ({ getDatabase: vi.fn(), ...tables }));
vi.mock('drizzle-orm', () => ({
  and: vi.fn(),
  eq: vi.fn(),
  inArray: vi.fn(),
  ne: vi.fn(),
}));

/** select 는 호출 순서대로 미리 정한 결과를 돌려주고, insert 는 테이블별로 모은다. */
function createTx(selectResults: unknown[][]) {
  const queue = [...selectResults];
  const inserts: Array<{ table: string; values: unknown }> = [];
  const tx = {
    select: vi.fn(() => ({
      from: () => ({ where: () => Promise.resolve(queue.shift() ?? []) }),
    })),
    insert: vi.fn((table: { name: string }) => ({
      values: (values: unknown) => {
        inserts.push({ table: table.name, values });
        const done = Promise.resolve();
        return Object.assign(done, { onConflictDoNothing: () => done });
      },
    })),
  };
  return { tx, inserts };
}

const caseRow = (id: string, suiteId: string | null) =>
  ({
    id,
    test_suite_id: suiteId,
    name: `케이스 ${id}`,
    test_type: null,
    tags: [],
    pre_condition: null,
    steps: null,
    expected_result: null,
  }) as never;

describe('recordCreatedCases (#391)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('스위트가 없는 케이스도 모두 v1 버전을 남기고 실행은 찾지 않는다', async () => {
    const { tx } = createTx([]);

    await recordCreatedCases(tx as never, [caseRow('c1', null), caseRow('c2', null)], '요약');

    expect(createInitialVersions).toHaveBeenCalledWith(
      [
        { testCaseId: 'c1', snapshot: expect.objectContaining({ name: '케이스 c1' }) },
        { testCaseId: 'c2', snapshot: expect.objectContaining({ name: '케이스 c2' }) },
      ],
      '요약',
      tx
    );
    expect(tx.select).not.toHaveBeenCalled();
  });

  it('스위트에 연결된 진행 중 실행에 새 케이스를 모두 넣고 실행 상태를 다시 계산한다', async () => {
    const { tx, inserts } = createTx([
      [{ test_run_id: 'run-1', excluded_at: null }], // 스위트 직접 링크
      [], // 마일스톤 링크
      [{ id: 'run-1' }], // 완료·삭제되지 않은 실행
      [], // 이미 있는 케이스 실행
    ]);

    await recordCreatedCases(tx as never, [caseRow('c1', 's1'), caseRow('c2', 's1')], '요약');

    const caseRuns = inserts.find((i) => i.table === 'test_case_runs')?.values as Array<
      Record<string, unknown>
    >;
    expect(caseRuns.map((r) => [r.test_run_id, r.test_case_id, r.status])).toEqual([
      ['run-1', 'c1', 'untested'],
      ['run-1', 'c2', 'untested'],
    ]);
    expect(recomputeTestRunStatus).toHaveBeenCalledWith(tx, ['run-1']);
    expect(lockSuiteRunSync).toHaveBeenCalledWith(tx, ['s1']);
  });

  it('실행에서 제외된 스위트면 케이스를 넣지 않는다', async () => {
    const { tx, inserts } = createTx([[{ test_run_id: 'run-1', excluded_at: new Date() }], []]);

    await recordCreatedCases(tx as never, [caseRow('c1', 's1')], '요약');

    expect(inserts).toEqual([]);
    expect(recomputeTestRunStatus).not.toHaveBeenCalled();
  });

  it('만든 케이스가 없으면 아무것도 기록하지 않는다', async () => {
    const { tx } = createTx([]);

    await recordCreatedCases(tx as never, [], '요약');

    expect(createInitialVersions).not.toHaveBeenCalled();
  });
});
