import { queryOptions } from '@tanstack/react-query';
import { getTestSuites, getTestSuiteById } from './server-actions'; // Added getTestSuiteById

export const testSuitesQueryOptions = (projectId: string) =>
  queryOptions({
    queryKey: ['testSuites', projectId],
    queryFn: () => getTestSuites({ projectId }),
  });

// --- New content for missing exports ---

// Helper for query keys (assuming simple structure)
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
    queryFn: () => getTestSuiteById(id),
  });