import { getTestCase, getTestCases } from '@/entities';
import { QUERY_STALE_TIME_DEFAULT } from '@/shared/constants/query';
import { queryOptions } from '@tanstack/react-query';

export const testCaseQueryKeys = {
  all: ['testCases'] as const,
  list: (projectId: string) => [...testCaseQueryKeys.all, 'list', projectId] as const,
  detail: (caseId: string) => [...testCaseQueryKeys.all, 'detail', caseId] as const,
};

export const testCasesQueryOptions = (projectId: string) =>
  queryOptions({
    queryKey: testCaseQueryKeys.list(projectId),
    queryFn: () => getTestCases({ project_id: projectId }),
    staleTime: QUERY_STALE_TIME_DEFAULT,
  });

export const testCaseByIdQueryOptions = (caseId: string) =>
  queryOptions({
    queryKey: testCaseQueryKeys.detail(caseId),
    queryFn: () => getTestCase(caseId),
    staleTime: QUERY_STALE_TIME_DEFAULT,
  });