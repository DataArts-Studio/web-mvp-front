import { queryOptions } from '@tanstack/react-query';

import { getProjectById, getProjectByName } from './server-actions';

export const projectQueryKeys = {
  all: ['project'] as const,
  byName: (name: string) => [...projectQueryKeys.all, 'byName', name] as const,
  byId: (id: string) => [...projectQueryKeys.all, 'byId', id] as const,
};

export const projectByNameQueryOptions = (projectName: string) =>
  queryOptions({
    queryKey: projectQueryKeys.byName(projectName),
    queryFn: () => getProjectByName(projectName),
    staleTime: Infinity,
    gcTime: Infinity,
  });

export const projectByIdQueryOptions = (projectId: string) =>
  queryOptions({
    queryKey: projectQueryKeys.byId(projectId),
    queryFn: () => getProjectById(projectId),
    staleTime: Infinity,
    gcTime: Infinity,
  });
