import { queryOptions } from '@tanstack/react-query';
import { getVersionsByTestCaseId, getVersionDetail, compareVersions } from './actions';

export const versionQueryKeys = {
  all: ['testCaseVersions'] as const,
  list: (testCaseId: string) => [...versionQueryKeys.all, 'list', testCaseId] as const,
  detail: (testCaseId: string, versionNumber: number) =>
    [...versionQueryKeys.all, 'detail', testCaseId, versionNumber] as const,
  compare: (testCaseId: string, oldV: number, newV: number) =>
    [...versionQueryKeys.all, 'compare', testCaseId, oldV, newV] as const,
};

export const versionsListQueryOptions = (testCaseId: string) =>
  queryOptions({
    queryKey: versionQueryKeys.list(testCaseId),
    queryFn: () => getVersionsByTestCaseId(testCaseId),
    staleTime: 5 * 60 * 1000,
    enabled: !!testCaseId,
  });

export const versionDetailQueryOptions = (testCaseId: string, versionNumber: number) =>
  queryOptions({
    queryKey: versionQueryKeys.detail(testCaseId, versionNumber),
    queryFn: () => getVersionDetail(testCaseId, versionNumber),
    staleTime: 5 * 60 * 1000,
    enabled: !!testCaseId && versionNumber > 0,
  });

export const versionCompareQueryOptions = (testCaseId: string, oldV: number, newV: number) =>
  queryOptions({
    queryKey: versionQueryKeys.compare(testCaseId, oldV, newV),
    queryFn: () => compareVersions(testCaseId, oldV, newV),
    staleTime: 5 * 60 * 1000,
    enabled: !!testCaseId && oldV > 0 && newV > 0 && oldV !== newV,
  });
