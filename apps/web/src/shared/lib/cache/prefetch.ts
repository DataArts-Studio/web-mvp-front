import { unstable_cache } from 'next/cache';

/**
 * 서버 컴포넌트 prefetch용 캐시 래퍼.
 * 라우트 이동 시 동일 데이터를 매번 DB에서 조회하지 않도록 캐싱합니다.
 * 뮤테이션 시 revalidateTag('tag')로 무효화할 수 있습니다.
 */

// --- Project ---
export const cachedGetProjectId = unstable_cache(
  async (slug: string) => {
    const { getProjectIdBySlug } = await import('@/entities/project/api/server-actions');
    return getProjectIdBySlug(slug);
  },
  ['project-id-by-slug'],
  { revalidate: 300, tags: ['project'] },
);

// --- Test Cases ---
export const cachedGetTestCasesList = unstable_cache(
  async (params: { project_id: string; page?: number; size?: number; sort?: string; search?: string; suiteId?: string }) => {
    const { getTestCasesList } = await import('@/entities/test-case/api/server-actions');
    return getTestCasesList(params);
  },
  ['test-cases-list'],
  { revalidate: 60, tags: ['test-cases'] },
);

// --- Test Suites ---
export const cachedGetTestSuites = unstable_cache(
  async (projectId: string) => {
    const { getTestSuites } = await import('@/entities/test-suite/api/server-actions');
    return getTestSuites({ projectId });
  },
  ['test-suites'],
  { revalidate: 60, tags: ['test-suites'] },
);

// --- Milestones ---
export const cachedGetMilestones = unstable_cache(
  async (projectId: string) => {
    const { getMilestones } = await import('@/entities/milestone/api/server-actions');
    return getMilestones({ projectId });
  },
  ['milestones'],
  { revalidate: 60, tags: ['milestones'] },
);

// --- Dashboard Stats ---
export const cachedGetDashboardStats = unstable_cache(
  async (slug: string) => {
    const { getDashboardStats } = await import('@/features/dashboard/api/get-dashboard-stats');
    return getDashboardStats({ slug });
  },
  ['dashboard-stats'],
  { revalidate: 60, tags: ['dashboard'] },
);

// --- Test Runs ---
export const cachedGetTestRuns = unstable_cache(
  async (projectId: string) => {
    const { getTestRunsByProjectId } = await import('@/features/runs/api/get-test-runs');
    return getTestRunsByProjectId(projectId);
  },
  ['test-runs'],
  { revalidate: 60, tags: ['test-runs'] },
);
