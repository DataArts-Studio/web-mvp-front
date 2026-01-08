import { queryOptions } from '@tanstack/react-query';
import { getMilestoneById } from './get-milestone-by-id';

export const milestoneByIdQueryOptions = (milestoneId: string) =>
  queryOptions({
    queryKey: ['milestone', milestoneId],
    queryFn: () => getMilestoneById(milestoneId),
  });
