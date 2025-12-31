import { getTestCases } from '@/entities';
import { queryOptions } from '@tanstack/react-query';

export const testCaseQueryKeys = {
  all: ['testCases'] as const,
  list: (projectId: string) => [...testCaseQueryKeys.all, 'list', projectId] as const,
};

export const testCasesQueryOptions = (projectId: string) =>
  queryOptions({
    queryKey: testCaseQueryKeys.list(projectId),
    queryFn: () => getTestCases({ project_id: projectId }),
    staleTime: 1000 * 60 * 5,
  });
