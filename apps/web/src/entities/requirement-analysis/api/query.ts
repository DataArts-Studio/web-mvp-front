import { QUERY_STALE_TIME_DEFAULT } from '@/shared/constants/query';
import { queryOptions } from '@tanstack/react-query';

import { getRequirementAnalyses } from './server-actions';

export const requirementAnalysisQueryKeys = {
  all: ['requirementAnalyses'] as const,
  list: (projectId: string) => [...requirementAnalysisQueryKeys.all, projectId] as const,
};

export const requirementAnalysesQueryOptions = (projectId: string) =>
  queryOptions({
    queryKey: requirementAnalysisQueryKeys.list(projectId),
    queryFn: () => getRequirementAnalyses(projectId),
    staleTime: QUERY_STALE_TIME_DEFAULT,
  });
