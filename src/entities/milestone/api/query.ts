import { queryOptions } from '@tanstack/react-query';
import { getMilestones } from './server-actions';

export const milestonesQueryOptions = (projectId: string) =>
  queryOptions({
    queryKey: ['milestones', projectId],
    queryFn: () => getMilestones({ projectId }),
  });
