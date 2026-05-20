import { getMilestones } from '@/entities/milestone';
import { queryOptions } from '@tanstack/react-query';

export const milestoneQueryKeys = {
  all: ['milestones'] as const,
  list: (projectId: string) => [...milestoneQueryKeys.all, 'list', projectId] as const,
};

export const milestonesQueryOptions = (projectId: string) =>
  queryOptions({
    queryKey: milestoneQueryKeys.list(projectId),
    queryFn: () => getMilestones({ projectId }),
    staleTime: 1000 * 60 * 5,
    enabled: !!projectId,
  });
