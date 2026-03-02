import { queryOptions } from '@tanstack/react-query';
import { QUERY_STALE_TIME_DEFAULT } from '@/shared/constants/query';
import { getTestSuites, getTestSuiteByIdWithStats } from './server-actions';

export const testSuitesQueryOptions = (projectId: string) =>
  queryOptions({
    queryKey: ['testSuites', projectId],
    queryFn: () => getTestSuites({ projectId }),
    staleTime: QUERY_STALE_TIME_DEFAULT,
  });

export const testSuiteQueryKeys = {
  all: ['testSuites'] as const,
  lists: () => [...testSuiteQueryKeys.all, 'list'] as const,
  list: (projectId: string) => [...testSuiteQueryKeys.lists(), projectId] as const,
  details: () => [...testSuiteQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...testSuiteQueryKeys.details(), id] as const,
};

export const testSuiteByIdQueryOptions = (id: string) =>
  queryOptions({
    queryKey: testSuiteQueryKeys.detail(id),
    queryFn: () => getTestSuiteByIdWithStats(id),
    staleTime: QUERY_STALE_TIME_DEFAULT,
  });