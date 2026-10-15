import { QUERY_STALE_TIME_DEFAULT } from '@/shared/constants/query';
import { queryOptions } from '@tanstack/react-query';

import {
  getSuiteCaseRecentResults,
  getTestSuiteByIdWithStats,
  getTestSuites,
} from './server-actions';

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

/** 스위트 케이스별 최근 결과. 케이스 결과가 바뀌면 케이스·스위트 쿼리와 함께 무효화된다. */
export const suiteCaseRecentResultsQueryOptions = (suiteId: string) =>
  queryOptions({
    queryKey: [...testSuiteQueryKeys.detail(suiteId), 'caseRecentResults'] as const,
    queryFn: () => getSuiteCaseRecentResults(suiteId),
    staleTime: QUERY_STALE_TIME_DEFAULT,
  });
