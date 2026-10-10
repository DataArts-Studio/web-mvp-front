import { getProjectByName, getProjectIdBySlug } from '@/entities/project/api/server-actions';
import { getDashboardStats } from '@/features/dashboard/api/get-dashboard-stats';
import { getDatabase, projects } from '@testea/db';
import type { SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { beforeEach, expect, it, vi } from 'vitest';

import { requireProjectAccess } from './require-access';

vi.mock('@testea/db', async (original) => ({
  ...(await original<typeof import('@testea/db')>()),
  getDatabase: vi.fn(),
}));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('./require-access', () => ({ requireProjectAccess: vi.fn() }));
let name = '';
const names: unknown[] = [];
let queries = 0;
beforeEach(() => {
  vi.clearAllMocks();
  names.length = 0;
  queries = 0;
  vi.mocked(requireProjectAccess).mockResolvedValue(true);
  const select = () => {
    queries++;
    let table: unknown;
    let queryName: unknown;
    const result = () =>
      table === projects && queryName === name
        ? [
            {
              id: 'project-id',
              projectId: 'project-id',
              name,
              created_at: new Date('2026-01-01'),
              description: null,
              owner_name: null,
            },
          ]
        : [];
    // Drizzle의 await 가능 쿼리 체인을 모의하되 권한 해석과 각 액션은 실제 코드를 실행한다.
    const chain = {
      from: (value: unknown) => {
        table = value;
        return chain;
      },
      where: (condition: SQL) => {
        if (table === projects) {
          queryName = new PgDialect().sqlToQuery(condition).params[0];
          names.push(queryName);
        }
        return chain;
      },
      leftJoin: () => chain,
      groupBy: () => chain,
      orderBy: () => chain,
      limit: async () => result(),
      then: (resolve: (rows: unknown[]) => unknown) => Promise.resolve(result()).then(resolve),
    };
    return chain;
  };
  vi.mocked(getDatabase).mockReturnValue({ select } as never);
});
it.each(['%', '%41', '한글 프로젝트'])(
  '프로젝트 %s의 권한·기본 정보·대시보드 조회가 원래 이름을 유지한다.',
  async (value) => {
    name = value;
    const slug = encodeURIComponent(name);
    expect(await getProjectIdBySlug(slug)).toEqual({ success: true, data: { id: 'project-id' } });
    const project = await getProjectByName(slug);
    expect(project.success).toBe(true);
    if (project.success) expect(project.data.projectName).toBe(name);
    const dashboard = await getDashboardStats({ slug });
    expect(dashboard.success).toBe(true);
    if (dashboard.success) expect(dashboard.data.project.name).toBe(name);
    expect(names).toEqual(Array(6).fill(name));
    expect(requireProjectAccess).toHaveBeenCalledTimes(3);
    expect(requireProjectAccess).toHaveBeenCalledWith('project-id');
  }
);
it('특수문자 이름도 권한을 거부하면 후속 데이터 조회를 하지 않는다.', async () => {
  name = '%41';
  vi.mocked(requireProjectAccess).mockResolvedValue(false);
  expect((await getDashboardStats({ slug: encodeURIComponent(name) })).success).toBe(false);
  expect(queries).toBe(1);
});
