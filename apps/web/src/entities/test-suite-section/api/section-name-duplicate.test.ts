import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createSection, updateSection } from './server-actions';

vi.mock('server-only', () => ({}));
vi.mock('@/access/lib/require-access', () => ({
  requireProjectAccess: vi.fn(async () => true),
}));
vi.mock('@/access/lib/project-scope', () => ({
  ACCESS_DENIED: { success: false, errors: { _general: ['접근 권한이 없습니다.'] } },
  canAccess: vi.fn(async () => true),
}));
vi.mock('@/shared/lib/cache/tags', () => ({
  INVALIDATE: { suites: [] },
  invalidateCache: vi.fn(),
}));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('uuid', () => ({ v7: vi.fn(() => 'section-new') }));

const whereArgs: unknown[] = [];
const selectResults: unknown[][] = [];

// select().from().where() 는 바로 await 하거나 .limit() 를 이어 붙인다. 결과는 호출 순서대로 꺼낸다.
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

const row = {
  id: 'section-1',
  suite_id: 'suite-1',
  name: '로그인',
  sort_order: 0,
  archived_at: null,
  created_at: new Date('2026-10-01'),
  updated_at: new Date('2026-10-01'),
};

vi.mock('@testea/db', () => ({
  getDatabase: () => ({
    select: () => selectChain(),
    insert: () => ({ values: () => ({ returning: async () => [row] }) }),
    update: () => ({ set: () => ({ where: () => ({ returning: async () => [row] }) }) }),
  }),
  testCases: {},
  testSuites: { id: 'suites.id', project_id: 'suites.project_id' },
  testSuiteSections: {
    id: 'sections.id',
    suite_id: 'sections.suite_id',
    name: 'sections.name',
    sort_order: 'sections.sort_order',
    archived_at: 'sections.archived_at',
  },
}));

vi.mock('drizzle-orm', () => ({
  and: (...conds: unknown[]) => ({ and: conds }),
  asc: vi.fn(),
  eq: (field: unknown, value: unknown) => ({ eq: [field, value] }),
  isNull: (field: unknown) => ({ isNull: field }),
}));

/** 이름 중복 확인 조회의 조건(이름 비교가 들어간 where). */
const duplicateCheck = () =>
  whereArgs.find((arg) => JSON.stringify(arg).includes('"sections.name"')) as {
    and: unknown[];
  };

describe('섹션 이름 중복 확인 (#410)', () => {
  beforeEach(() => {
    whereArgs.length = 0;
    selectResults.length = 0;
  });

  it('생성할 때 삭제한 섹션은 중복으로 보지 않는다', async () => {
    selectResults.push([{ projectId: 'project-1' }], [], []);

    const result = await createSection({ suiteId: 'suite-1', name: '로그인' });

    expect(result.success).toBe(true);
    expect(duplicateCheck().and).toContainEqual({ isNull: 'sections.archived_at' });
  });

  it('이름을 바꿀 때도 삭제한 섹션은 중복으로 보지 않는다', async () => {
    selectResults.push([row], [{ projectId: 'project-1' }], []);

    const result = await updateSection({ id: 'section-1', name: '회원가입' });

    expect(result.success).toBe(true);
    expect(duplicateCheck().and).toContainEqual({ isNull: 'sections.archived_at' });
  });

  it('활성 섹션과 이름이 겹치면 막는다', async () => {
    selectResults.push([{ projectId: 'project-1' }], [{ id: 'section-2' }]);

    const result = await createSection({ suiteId: 'suite-1', name: '로그인' });

    expect(result.success).toBe(false);
  });
});
