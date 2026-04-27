import { queryOptions } from '@tanstack/react-query';
import { getAiConfig } from './server-actions';

export const aiConfigQueryKeys = {
  all: ['ai-config'] as const,
  config: (projectId: string) => [...aiConfigQueryKeys.all, projectId] as const,
};

export const aiConfigQueryOptions = (projectId: string) =>
  queryOptions({
    queryKey: aiConfigQueryKeys.config(projectId),
    queryFn: () => getAiConfig(projectId),
    staleTime: Infinity,
  });
