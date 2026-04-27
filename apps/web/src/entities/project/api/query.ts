import { queryOptions } from '@tanstack/react-query';

import { getProjectById, getProjectByName, getProjectIdBySlug } from './server-actions';

export const projectQueryKeys = {
  all: ['project'] as const,
  idBySlug: (slug: string) => [...projectQueryKeys.all, 'idBySlug', slug] as const,
  byName: (name: string) => [...projectQueryKeys.all, 'byName', name] as const,
  byId: (id: string) => [...projectQueryKeys.all, 'byId', id] as const,
};

export const projectIdQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: projectQueryKeys.idBySlug(slug),
    queryFn: () => getProjectIdBySlug(slug),
    staleTime: Infinity,
    gcTime: Infinity,
  });

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
