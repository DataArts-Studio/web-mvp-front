import { queryOptions } from '@tanstack/react-query';
import { getProjectTags } from './get-project-tags';

export const projectTagsQueryOptions = (projectId: string) =>
  queryOptions({
    queryKey: ['project-tags', projectId],
    queryFn: () => getProjectTags(projectId),
    staleTime: 5 * 60 * 1000,
    enabled: !!projectId,
  });
