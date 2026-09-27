import { requireProjectAccess } from '@/access/lib/require-access';
import { createTestRunAction } from '@/features/runs-create/model/server-action';
import { invalidateCache } from '@/shared/lib/cache/tags';
import { getDatabase, testCaseRuns, testRunSuites, testRuns } from '@testea/db';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { addMilestonesToRunAction } from './add-milestones-to-run';
import { addSuitesToRunAction } from './add-suites-to-run';

vi.mock('@/access/lib/require-access', () => ({ requireProjectAccess: vi.fn() }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/shared/lib/cache/tags', () => ({ INVALIDATE: { runs: [] }, invalidateCache: vi.fn() }));
vi.mock('@testea/db', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@testea/db')>()),
  getDatabase: vi.fn(),
}));

const A = '00000000-0000-4000-8000-000000000001';
const B = '00000000-0000-4000-8000-000000000002';
const RUN = '00000000-0000-4000-8000-000000000003';
const SOURCE = '00000000-0000-4000-8000-000000000004';
const CASE = '00000000-0000-4000-8000-000000000005';
const OTHER = '00000000-0000-4000-8000-000000000006';
const owned = (id: string, projectId = A) => ({ id, projectId });
const read = vi.fn();
const values = vi.fn(() => ({
  returning: vi.fn(async () => [{ id: RUN }]),
  onConflictDoNothing: vi.fn(async () => undefined),
}));
const tx = {
  select: vi.fn(() => ({ from: vi.fn(() => ({ where: read })) })),
  insert: vi.fn(() => ({ values })),
  update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn() })) })),
};
const limit = vi.fn();
const db = {
  select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit })) })) })),
  transaction: vi.fn(async (callback: (connection: typeof tx) => unknown) => callback(tx)),
};

const actions = [
  {
    name: '실행 생성',
    kind: 'create',
    call: () => createTestRunAction({ project_id: A, name: '실행', milestone_id: SOURCE }),
  },
  { name: '스위트 추가', kind: 'suite', call: () => addSuitesToRunAction(RUN, [SOURCE]) },
  { name: '마일스톤 교체', kind: 'milestone', call: () => addMilestonesToRunAction(RUN, [SOURCE]) },
] as const;

beforeEach(() => {
  vi.clearAllMocks();
  read.mockReset().mockResolvedValue([]);
  limit.mockResolvedValue([{ projectId: A }]);
  vi.mocked(requireProjectAccess).mockImplementation(async (id) => id === A);
  vi.mocked(getDatabase).mockReturnValue(db as unknown as ReturnType<typeof getDatabase>);
});

function expectNoWrites() {
  expect(tx.insert).not.toHaveBeenCalled();
  expect(tx.update).not.toHaveBeenCalled();
  expect(invalidateCache).not.toHaveBeenCalled();
}

describe.each(actions)('$name 프로젝트 경계', ({ kind, call }) => {
  it('무인증 요청은 쓰기 없이 거부한다.', async () => {
    vi.mocked(requireProjectAccess).mockResolvedValue(false);
    expect((await call()).success).toBe(false);
    expect(db.transaction).not.toHaveBeenCalled();
    expectNoWrites();
  });

  it.each([{ rows: [] }, { rows: [owned(SOURCE, B)] }])(
    '누락 또는 다른 프로젝트의 연결 대상을 거부한다: %j.',
    async ({ rows }) => {
      read.mockResolvedValueOnce(rows);
      expect((await call()).success).toBe(false);
      expectNoWrites();
    }
  );

  it('연결된 케이스가 다른 프로젝트이면 첫 쓰기 전에 거부한다.', async () => {
    read.mockResolvedValueOnce([owned(SOURCE)]);
    read.mockResolvedValueOnce(
      kind === 'suite'
        ? [{ id: CASE, test_suite_id: SOURCE }]
        : [{ test_case_id: CASE, milestone_id: SOURCE }]
    );
    if (kind === 'create') read.mockResolvedValueOnce([]);
    read.mockResolvedValueOnce([owned(CASE, B)]);
    expect((await call()).success).toBe(false);
    expectNoWrites();
  });

  it('같은 프로젝트의 연결 대상과 케이스는 정상 반영한다.', async () => {
    read.mockResolvedValueOnce([owned(SOURCE)]);
    read.mockResolvedValueOnce(
      kind === 'suite'
        ? [{ id: CASE, test_suite_id: SOURCE }]
        : [{ test_case_id: CASE, milestone_id: SOURCE }]
    );
    if (kind === 'create') read.mockResolvedValueOnce([]);
    read.mockResolvedValueOnce([owned(CASE)]);
    const result = await call();
    expect(result.success).toBe(true);
    expect(invalidateCache).toHaveBeenCalledTimes(1);
    expect(tx.insert).toHaveBeenCalledWith(testCaseRuns);
    expect(values).toHaveBeenCalledWith([
      expect.objectContaining({
        test_run_id: RUN,
        test_case_id: CASE,
        source_id: SOURCE,
        source_type: kind === 'suite' ? 'suite' : 'milestone',
      }),
    ]);
    if (kind === 'create') expect(tx.insert).toHaveBeenCalledWith(testRuns);
    if (kind === 'milestone') expect(tx.update).toHaveBeenCalledWith(testRuns);
  });
});

describe('연결 배열 및 기존 관계 검증', () => {
  it('마일스톤 배열에 타 프로젝트 ID가 섞이면 아무것도 기록하지 않는다.', async () => {
    read.mockResolvedValueOnce([owned(SOURCE), owned(OTHER, B)]);
    expect((await addMilestonesToRunAction(RUN, [SOURCE, OTHER])).success).toBe(false);
    expectNoWrites();
  });

  it('여러 소유 마일스톤을 선택하면 기존 첫 번째 마일스톤 적용 동작을 유지한다.', async () => {
    read.mockResolvedValueOnce([owned(SOURCE), owned(OTHER)]);
    expect(await addMilestonesToRunAction(RUN, [SOURCE, OTHER])).toEqual({
      success: true,
      addedCount: 0,
    });
    expect(tx.update).toHaveBeenCalledWith(testRuns);
    expect(tx.insert).not.toHaveBeenCalled();
  });
  it('소유 스위트와 타 프로젝트 스위트가 섞이면 아무것도 기록하지 않는다.', async () => {
    read.mockResolvedValueOnce([owned(SOURCE), owned(OTHER, B)]);
    expect((await addSuitesToRunAction(RUN, [SOURCE, OTHER])).success).toBe(false);
    expectNoWrites();
  });

  it('스위트 배열 중 일부 ID가 없으면 아무것도 기록하지 않는다.', async () => {
    read.mockResolvedValueOnce([owned(SOURCE)]);
    expect((await addSuitesToRunAction(RUN, [SOURCE, OTHER])).success).toBe(false);
    expectNoWrites();
  });

  it('스위트 중복 입력을 한 번만 연결하고 기존 실행 케이스를 중복 생성하지 않는다.', async () => {
    read
      .mockResolvedValueOnce([owned(SOURCE)])
      .mockResolvedValueOnce([{ id: CASE, test_suite_id: SOURCE }])
      .mockResolvedValueOnce([owned(CASE)])
      .mockResolvedValueOnce([{ test_case_id: CASE }]);
    expect(await addSuitesToRunAction(RUN, [SOURCE, SOURCE])).toEqual({
      success: true,
      addedCount: 0,
    });
    expect(tx.insert).toHaveBeenCalledTimes(1);
    expect(tx.insert).toHaveBeenCalledWith(testRunSuites);
    expect(values).toHaveBeenCalledWith([{ test_run_id: RUN, test_suite_id: SOURCE }]);
  });

  it('생성 시 마일스톤에 연결된 타 프로젝트 스위트를 거부한다.', async () => {
    read
      .mockResolvedValueOnce([owned(SOURCE)])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ test_suite_id: OTHER }])
      .mockResolvedValueOnce([owned(OTHER, B)]);
    expect((await actions[0].call()).success).toBe(false);
    expectNoWrites();
  });

  it('생성 시 스위트 경유로 연결된 타 프로젝트 케이스를 거부한다.', async () => {
    read
      .mockResolvedValueOnce([owned(SOURCE)])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ test_suite_id: OTHER }])
      .mockResolvedValueOnce([owned(OTHER)])
      .mockResolvedValueOnce([{ id: CASE, test_suite_id: OTHER }])
      .mockResolvedValueOnce([owned(CASE, B)]);
    expect((await actions[0].call()).success).toBe(false);
    expectNoWrites();
  });

  it.each([
    () => addSuitesToRunAction('invalid', [SOURCE]),
    () => addSuitesToRunAction(RUN, ['invalid']),
    () => addSuitesToRunAction(RUN, []),
    () => addMilestonesToRunAction(RUN, []),
    () => addMilestonesToRunAction(RUN, ['invalid']),
  ])('잘못된 입력은 DB 접근 전에 거부한다.', async (call) => {
    expect((await call()).success).toBe(false);
    expect(getDatabase).not.toHaveBeenCalled();
    expectNoWrites();
  });

  it.each(actions.slice(1))('다른 프로젝트 실행의 $name 요청을 거부한다.', async ({ call }) => {
    limit.mockResolvedValueOnce([{ projectId: B }]);
    expect((await call()).success).toBe(false);
    expect(requireProjectAccess).toHaveBeenCalledWith(B);
    expect(db.transaction).not.toHaveBeenCalled();
    expectNoWrites();
  });
});
