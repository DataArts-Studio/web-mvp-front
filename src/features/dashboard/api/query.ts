import { getDashboardStats } from '@/features';
import { queryOptions } from '@tanstack/react-query';


export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  stats: (slug: string) => [...dashboardQueryKeys.all, 'stats', slug] as const,
};

export const dashboardQueryOptions = {
  stats: (slug: string) =>
    queryOptions({
      queryKey: dashboardQueryKeys.stats(slug),
      queryFn: () => getDashboardStats({ slug }),
      staleTime: 1000 * 60 * 5,
    }),
};
