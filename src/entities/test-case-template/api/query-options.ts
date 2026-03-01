import { queryOptions } from '@tanstack/react-query';
import { getTemplatesByProjectId, getTemplateById } from './server-actions';

export const templateQueryKeys = {
  all: ['templates'] as const,
  list: (projectId: string) => ['templates', 'list', projectId] as const,
  detail: (templateId: string) => ['templates', 'detail', templateId] as const,
};

export const templatesQueryOptions = (projectId: string) =>
  queryOptions({
    queryKey: templateQueryKeys.list(projectId),
    queryFn: () => getTemplatesByProjectId(projectId),
    staleTime: 5 * 60 * 1000,
    enabled: !!projectId,
  });

export const templateByIdQueryOptions = (templateId: string) =>
  queryOptions({
    queryKey: templateQueryKeys.detail(templateId),
    queryFn: () => getTemplateById(templateId),
    staleTime: 5 * 60 * 1000,
    enabled: !!templateId,
  });
