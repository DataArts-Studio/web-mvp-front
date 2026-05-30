import { QUERY_STALE_TIME_DEFAULT } from '@/shared/constants/query';
import { queryOptions } from '@tanstack/react-query';

import type { ScenarioListFilter } from '../model/types';
import { getScenarioFeatures, getScenarios } from './server-actions';

export const scenarioQueryKeys = {
  all: ['scenarios'] as const,
  list: (projectId: string, filter?: ScenarioListFilter) =>
    [...scenarioQueryKeys.all, projectId, filter ?? {}] as const,
};

export const scenariosQueryOptions = (projectId: string, filter?: ScenarioListFilter) =>
  queryOptions({
    queryKey: scenarioQueryKeys.list(projectId, filter),
    queryFn: () => getScenarios(projectId, filter),
    staleTime: QUERY_STALE_TIME_DEFAULT,
  });

export const scenarioFeatureQueryKeys = {
  all: ['scenarioFeatures'] as const,
  list: (projectId: string) => [...scenarioFeatureQueryKeys.all, projectId] as const,
};

export const scenarioFeaturesQueryOptions = (projectId: string) =>
  queryOptions({
    queryKey: scenarioFeatureQueryKeys.list(projectId),
    queryFn: () => getScenarioFeatures(projectId),
    staleTime: QUERY_STALE_TIME_DEFAULT,
  });
