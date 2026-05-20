import { QUERY_STALE_TIME_DEFAULT } from '@/shared/constants/query';
import { queryOptions } from '@tanstack/react-query';

import { getMilestones } from './server-actions';

export const milestonesQueryOptions = (projectId: string) =>
  queryOptions({
    queryKey: ['milestones', projectId],
    queryFn: () => getMilestones({ projectId }),
    staleTime: QUERY_STALE_TIME_DEFAULT,
  });
