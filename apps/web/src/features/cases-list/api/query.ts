import { getTestCase, getTestCasesList } from '@/entities/test-case/api/server-actions';
import { QUERY_STALE_TIME_DEFAULT } from '@/shared/constants/query';
import { queryOptions } from '@tanstack/react-query';

export type TestCasesListParams = {
  page?: number;
  size?: number;
  sort?: string;
  search?: string;
  suiteId?: string;
};

export const testCaseQueryKeys = {
  all: ['testCases'] as const,
  list: (projectId: string, params?: TestCasesListParams) =>
    [...testCaseQueryKeys.all, 'list', projectId, params ?? {}] as const,
  detail: (caseId: string) => [...testCaseQueryKeys.all, 'detail', caseId] as const,
};

export const testCasesQueryOptions = (projectId: string, params: TestCasesListParams = {}) =>
  queryOptions({
    queryKey: testCaseQueryKeys.list(projectId, params),
    queryFn: () => getTestCasesList({ project_id: projectId, ...params }),
    staleTime: QUERY_STALE_TIME_DEFAULT,
  });

export const testCaseByIdQueryOptions = (caseId: string) =>
  queryOptions({
    queryKey: testCaseQueryKeys.detail(caseId),
    queryFn: () => getTestCase(caseId),
    staleTime: QUERY_STALE_TIME_DEFAULT,
  });
