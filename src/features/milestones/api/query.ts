import { queryOptions } from '@tanstack/react-query';
import { QUERY_STALE_TIME_DEFAULT } from '@/shared/constants/query';
import { getMilestoneById } from './get-milestone-by-id';

export const milestoneByIdQueryOptions = (milestoneId: string) =>
  queryOptions({
    queryKey: ['milestone', milestoneId],
    queryFn: () => getMilestoneById(milestoneId),
    staleTime: QUERY_STALE_TIME_DEFAULT,
  });
