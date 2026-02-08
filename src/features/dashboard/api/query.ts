import { getDashboardStats } from '@/features';
import { queryOptions } from '@tanstack/react-query';
import { getDashboardMilestones } from './get-dashboard-milestones';


export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  stats: (slug: string) => [...dashboardQueryKeys.all, 'stats', slug] as const,
  milestones: (projectId: string, testRunId?: string) => [...dashboardQueryKeys.all, 'milestones', projectId, testRunId ?? 'all'] as const,
};

export const dashboardQueryOptions = {
  stats: (slug: string) =>
    queryOptions({
      queryKey: dashboardQueryKeys.stats(slug),
      queryFn: () => getDashboardStats({ slug }),
      staleTime: 1000 * 60 * 5,
    }),
  milestones: (projectId: string, testRunId?: string) =>
    queryOptions({
      queryKey: dashboardQueryKeys.milestones(projectId, testRunId),
      queryFn: () => getDashboardMilestones(projectId, testRunId),
      staleTime: 1000 * 60 * 5,
    }),
};
