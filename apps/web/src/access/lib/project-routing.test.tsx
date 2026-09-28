import React from 'react';

import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import ProjectAccessPage from '../../../app/projects/[slug]/access/page';
import ProjectLayout from '../../../app/projects/[slug]/layout';
import { canAccessProject } from '../policy';
import { getValidAccessToken } from '../policy/access-policy';
import { checkProjectExists } from '../project/api';

vi.mock('next/headers', () => ({
  headers: async () => new Headers({ 'x-testea-session-check': '1' }),
}));
vi.mock('next/navigation', () => ({ redirect: vi.fn(), notFound: vi.fn() }));
vi.mock('../policy/access-policy', () => ({
  getValidAccessToken: vi.fn(async () => ({ projectId: 'id' })),
}));
vi.mock('../policy', () => ({ canAccessProject: vi.fn(async () => false) }));
vi.mock('../project/api', () => ({ checkProjectExists: vi.fn(async () => true) }));
vi.mock('../project/ui', () => ({ AccessForm: () => null }));
vi.mock('@/app-shell/providers/query-provider', () => ({ QueryProvider: () => null }));
vi.mock('@/features/command-palette', () => ({ CommandPalette: () => null }));
vi.mock('@/shared/lib/route-loading', () => ({ RouteLoadingProvider: () => null }));
vi.mock('@/widgets/aside', () => ({ Aside: () => null }));
vi.mock('@testea/ui', () => ({ Container: () => null }));
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('React', React);
});
afterEach(() => vi.unstubAllGlobals());
it.each(['%', '%41', '한글 프로젝트'])(
  '프로젝트 %s의 params를 이중 디코딩하지 않는다.',
  async (slug) => {
    await ProjectLayout({ children: null, params: Promise.resolve({ slug }) });
    expect(getValidAccessToken).toHaveBeenCalledWith(slug);
    await ProjectAccessPage({
      params: Promise.resolve({ slug }),
      searchParams: Promise.resolve({}),
    });
    expect(checkProjectExists).toHaveBeenCalledWith(slug);
    expect(canAccessProject).toHaveBeenCalledWith(slug);
  }
);
