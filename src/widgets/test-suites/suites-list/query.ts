import { getTestSuites } from '@/entities';
import { QUERY_STALE_TIME_DEFAULT } from '@/shared/constants/query';
import { queryOptions } from '@tanstack/react-query';

export const testSuiteQueryKeys = {
  all: ['testSuites'] as const,
  list: (projectId: string) => [...testSuiteQueryKeys.all, 'list', projectId] as const
}

export const testSuitesQueryOptions = (projectId: string) =>
  queryOptions({
    queryKey: testSuiteQueryKeys.list(projectId),
    queryFn: () => getTestSuites({ projectId }),
    staleTime: QUERY_STALE_TIME_DEFAULT,
  });