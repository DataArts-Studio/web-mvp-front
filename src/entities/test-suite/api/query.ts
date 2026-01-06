import { queryOptions } from '@tanstack/react-query';

import { getTestSuiteById, getTestSuites } from './server-actions';

export const testSuiteQueryKeys = {
  all: ['testSuite'] as const,
  list: (projectId: string) => [...testSuiteQueryKeys.all, 'list', projectId] as const,
  byId: (id: string) => [...testSuiteQueryKeys.all, 'byId', id] as const,
};

export const testSuitesQueryOptions = (projectId: string) =>
  queryOptions({
    queryKey: testSuiteQueryKeys.list(projectId),
    queryFn: () => getTestSuites({ projectId }),
    staleTime: 1000 * 60 * 5, // 5분
  });

export const testSuiteByIdQueryOptions = (id: string) =>
  queryOptions({
    queryKey: testSuiteQueryKeys.byId(id),
    queryFn: () => getTestSuiteById(id),
    staleTime: 1000 * 60 * 5, // 5분
    enabled: !!id,
  });
