import { queryOptions } from '@tanstack/react-query';
import { getDashboardStats } from '@/features';

export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  stats: (projectId: string) => [...dashboardQueryKeys.all, 'stats', projectId] as const,
};

export const dashboardStatsQueryOptions = (projectId: string) =>
  queryOptions({
    queryKey: dashboardQueryKeys.stats(projectId),
    queryFn: () => getDashboardStats({ projectId }),
    staleTime: 1000 * 60 * 5,
  });
