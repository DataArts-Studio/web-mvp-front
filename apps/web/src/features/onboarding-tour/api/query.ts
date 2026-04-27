import { queryOptions } from '@tanstack/react-query';
import { getOnboardingStatus } from './server-actions';

export const onboardingQueryKeys = {
  all: ['onboarding'] as const,
  status: (projectId: string) => [...onboardingQueryKeys.all, 'status', projectId] as const,
};

export const onboardingQueryOptions = {
  status: (projectId: string) =>
    queryOptions({
      queryKey: onboardingQueryKeys.status(projectId),
      queryFn: () => getOnboardingStatus(projectId),
      staleTime: Infinity,
    }),
};
