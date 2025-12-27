import { getDashboardStats } from '@/features';
import { queryOptions } from '@tanstack/react-query';


export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  stats: (projectName: string) => [...dashboardQueryKeys.all, 'stats', projectName] as const,
};

export const dashboardStatsQueryOptions = (projectName: string) =>
  queryOptions({
    queryKey: dashboardQueryKeys.stats(projectName),
    queryFn: () => getDashboardStats({ projectName }),
    staleTime: 1000 * 60 * 5,
  });
