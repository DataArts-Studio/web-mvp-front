import { unstable_cache } from 'next/cache';

import { withVerifiedAccess } from '@/access/lib/project-scope';

/**
 * 서버 컴포넌트 prefetch용 캐시 래퍼.
 * 라우트 이동 시 동일 데이터를 매번 DB에서 조회하지 않도록 캐싱합니다.
 * 뮤테이션 시 revalidateTag('tag')로 무효화할 수 있습니다.
 *
 * 권한: 캐시 콜백 안에서는 cookies() 를 읽을 수 없으므로, 각 래퍼는 캐시 바깥에서
 * withVerifiedAccess 로 먼저 권한을 확인한다. 캐시 키는 인자뿐이라 권한 확인 없이 캐시를
 * 부르면 다른 사용자의 조회 결과가 그대로 나갈 수 있다. 캐시 원본(raw*)은 export 하지 않는다.
 */

// --- Project ---
const rawGetProjectId = unstable_cache(
  async (slug: string) => {
    const { getProjectIdBySlug } = await import('@/entities/project/api/server-actions');
    return getProjectIdBySlug(slug);
  },
  ['project-id-by-slug'],
  { revalidate: 300, tags: ['project'] }
);

// --- Test Cases ---
const rawGetTestCasesList = unstable_cache(
  async (params: {
    project_id: string;
    page?: number;
    size?: number;
    sort?: string;
    search?: string;
    suiteId?: string;
  }) => {
    const { getTestCasesList } = await import('@/entities/test-case/api/server-actions');
    return getTestCasesList(params);
  },
  ['test-cases-list'],
  { revalidate: 60, tags: ['test-cases'] }
);

// --- Test Suites ---
const rawGetTestSuites = unstable_cache(
  async (projectId: string) => {
    const { getTestSuites } = await import('@/entities/test-suite/api/server-actions');
    return getTestSuites({ projectId });
  },
  ['test-suites'],
  { revalidate: 60, tags: ['test-suites'] }
);

// --- Milestones ---
const rawGetMilestones = unstable_cache(
  async (projectId: string) => {
    const { getMilestones } = await import('@/entities/milestone/api/server-actions');
    return getMilestones({ projectId });
  },
  ['milestones'],
  { revalidate: 60, tags: ['milestones'] }
);

// --- Dashboard Stats ---
const rawGetDashboardStats = unstable_cache(
  async (slug: string) => {
    const { getDashboardStats } = await import('@/features/dashboard/api/get-dashboard-stats');
    return getDashboardStats({ slug });
  },
  ['dashboard-stats'],
  { revalidate: 60, tags: ['dashboard'] }
);

// --- Test Runs ---
const rawGetTestRuns = unstable_cache(
  async (projectId: string) => {
    const { getTestRunsByProjectId } = await import('@/features/runs/api/get-test-runs');
    return getTestRunsByProjectId(projectId);
  },
  ['test-runs'],
  { revalidate: 60, tags: ['test-runs'] }
);

// --- 권한 확인 후 캐시 조회 (서버 컴포넌트에서 쓰는 공개 API) ---
export const cachedGetProjectId = (slug: string) =>
  withVerifiedAccess('slug', slug, () => rawGetProjectId(slug));

export const cachedGetTestCasesList = (params: Parameters<typeof rawGetTestCasesList>[0]) =>
  withVerifiedAccess('project', params.project_id, () => rawGetTestCasesList(params));

export const cachedGetTestSuites = (projectId: string) =>
  withVerifiedAccess('project', projectId, () => rawGetTestSuites(projectId));

export const cachedGetMilestones = (projectId: string) =>
  withVerifiedAccess('project', projectId, () => rawGetMilestones(projectId));

export const cachedGetDashboardStats = (slug: string) =>
  withVerifiedAccess('slug', slug, () => rawGetDashboardStats(slug));

export const cachedGetTestRuns = (projectId: string) =>
  withVerifiedAccess('project', projectId, () => rawGetTestRuns(projectId));
