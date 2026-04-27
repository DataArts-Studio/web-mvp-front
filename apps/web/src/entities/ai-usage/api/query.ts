import { queryOptions } from '@tanstack/react-query';
import { getMonthlyUsage } from './server-actions';

export const aiUsageQueryKeys = {
  all: ['ai-usage'] as const,
  monthly: (projectId: string) => [...aiUsageQueryKeys.all, 'monthly', projectId] as const,
};

export const aiUsageQueryOptions = (projectId: string) =>
  queryOptions({
    queryKey: aiUsageQueryKeys.monthly(projectId),
    queryFn: () => getMonthlyUsage(projectId),
    staleTime: 30_000, // 30s
  });
