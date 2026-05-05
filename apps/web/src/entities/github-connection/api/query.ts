import { queryOptions } from '@tanstack/react-query';
import { QUERY_STALE_TIME_DEFAULT } from '@/shared/constants/query';
import { getGithubConnection, getExternalLinks } from './server-actions';

export const githubQueryKeys = {
  all: ['github'] as const,
  connection: (projectId: string) => [...githubQueryKeys.all, 'connection', projectId] as const,
  externalLinks: (testCaseId: string) => [...githubQueryKeys.all, 'links', testCaseId] as const,
};

export const githubConnectionQueryOptions = (projectId: string) =>
  queryOptions({
    queryKey: githubQueryKeys.connection(projectId),
    queryFn: () => getGithubConnection(projectId),
    staleTime: QUERY_STALE_TIME_DEFAULT,
  });

export const externalLinksQueryOptions = (testCaseId: string) =>
  queryOptions({
    queryKey: githubQueryKeys.externalLinks(testCaseId),
    queryFn: () => getExternalLinks(testCaseId),
    staleTime: QUERY_STALE_TIME_DEFAULT,
  });
