import { queryOptions } from '@tanstack/react-query';
import { QUERY_STALE_TIME_DEFAULT } from '@/shared/constants/query';
import { getChecklistsByProjectId, getChecklistById } from './server-actions';

export const checklistQueryKeys = {
  all: ['checklists'] as const,
  list: (projectId: string) => [...checklistQueryKeys.all, 'list', projectId] as const,
  detail: (checklistId: string) => [...checklistQueryKeys.all, 'detail', checklistId] as const,
};

export const checklistsQueryOptions = (projectId: string) =>
  queryOptions({
    queryKey: checklistQueryKeys.list(projectId),
    queryFn: () => getChecklistsByProjectId(projectId),
    staleTime: QUERY_STALE_TIME_DEFAULT,
  });

export const checklistByIdQueryOptions = (checklistId: string) =>
  queryOptions({
    queryKey: checklistQueryKeys.detail(checklistId),
    queryFn: () => getChecklistById(checklistId),
    staleTime: QUERY_STALE_TIME_DEFAULT,
  });
