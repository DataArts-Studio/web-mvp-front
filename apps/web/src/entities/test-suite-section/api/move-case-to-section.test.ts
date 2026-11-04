import { requireProjectAccess } from '@/access/lib/require-access';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { moveTestCaseToSection } from './server-actions';

vi.mock('server-only', () => ({}));
vi.mock('@/access/lib/require-access', () => ({
  requireProjectAccess: vi.fn(async () => true),
}));
vi.mock('@/access/lib/project-scope', () => ({
  ACCESS_DENIED: { success: false, errors: { _general: ['접근 권한이 없습니다.'] } },
  canAccess: vi.fn(async () => true),
}));
vi.mock('@/shared/lib/cache/tags', () => ({
  INVALIDATE: { cases: [] },
  invalidateCache: vi.fn(),
}));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));

const whereArgs: unknown[] = [];
const selectResults: unknown[][] = [];
const updates: { set: unknown; where: unknown }[] = [];

const selectChain = () => {
  const chain: Record<string, unknown> = {};
  chain.from = () => chain;
  chain.where = (arg: unknown) => {
    whereArgs.push(arg);
    const next = selectResults.shift() ?? [];
    return Object.assign(Promise.resolve(next), { limit: async () => next });
  };
  return chain;
};

vi.mock('@testea/db', () => ({
  getDatabase: () => ({
    select: () => selectChain(),
    update: () => ({
      set: (set: unknown) => ({
        where: async (where: unknown) => {
          updates.push({ set, where });
        },
      }),
    }),
  }),
  testCases: {
    id: 'cases.id',
    project_id: 'cases.project_id',
    test_suite_id: 'cases.test_suite_id',
    section_id: 'cases.section_id',
  },
  testSuites: { id: 'suites.id', project_id: 'suites.project_id' },
  testSuiteSections: {
    id: 'sections.id',
    suite_id: 'sections.suite_id',
    archived_at: 'sections.archived_at',
  },
}));

vi.mock('drizzle-orm', () => ({
  and: (...conds: unknown[]) => ({ and: conds }),
  asc: vi.fn(),
  eq: (field: unknown, value: unknown) => ({ eq: [field, value] }),
  isNull: (field: unknown) => ({ isNull: field }),
}));

const CASE = { projectId: 'project-a', suiteId: 'suite-1' };
const DENIED = { success: false, errors: { _section: ['접근 권한이 없습니다.'] } };

describe('케이스를 섹션으로 이동할 때 섹션 소속 확인', () => {
  beforeEach(() => {
    whereArgs.length = 0;
    selectResults.length = 0;
    updates.length = 0;
    vi.mocked(requireProjectAccess).mockResolvedValue(true);
  });

  it('같은 스위트의 활성 섹션으로는 옮긴다.', async () => {
    selectResults.push([CASE], [{ id: 'section-1' }]);
    expect(await moveTestCaseToSection('case-1', 'section-1')).toEqual({
      success: true,
      data: null,
    });
    // 섹션 조회는 케이스의 스위트와 보관 여부로 제한한다.
    const sectionQuery = JSON.stringify(whereArgs[1]);
    expect(sectionQuery).toContain('["sections.suite_id","suite-1"]');
    expect(sectionQuery).toContain('"isNull":"sections.archived_at"');
    expect(updates).toHaveLength(1);
    expect(JSON.stringify(updates[0].where)).toContain('["cases.project_id","project-a"]');
  });

  it('다른 프로젝트·다른 스위트·보관된 섹션은 조회되지 않아 거부한다.', async () => {
    selectResults.push([CASE], []);
    expect(await moveTestCaseToSection('case-1', 'section-of-project-b')).toEqual(DENIED);
    expect(updates).toHaveLength(0);
  });

  it('스위트에 속하지 않은 케이스는 섹션에 넣지 않는다.', async () => {
    selectResults.push([{ projectId: 'project-a', suiteId: null }]);
    expect(await moveTestCaseToSection('case-1', 'section-1')).toEqual(DENIED);
    expect(updates).toHaveLength(0);
  });

  it('섹션에서 빼는 것(null)은 섹션 조회 없이 허용한다.', async () => {
    selectResults.push([CASE]);
    expect((await moveTestCaseToSection('case-1', null)).success).toBe(true);
    expect(whereArgs).toHaveLength(1);
    expect(updates).toHaveLength(1);
  });

  it('케이스 프로젝트 권한이 없으면 거부한다.', async () => {
    selectResults.push([CASE]);
    vi.mocked(requireProjectAccess).mockResolvedValue(false);
    expect(await moveTestCaseToSection('case-1', 'section-1')).toEqual(DENIED);
    expect(updates).toHaveLength(0);
  });
});
