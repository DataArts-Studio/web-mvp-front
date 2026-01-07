// src/features/runs/api/query.ts
import { queryOptions } from '@tanstack/react-query';
import { getTestRunsByProjectId } from './get-test-runs';

export const testRunsQueryOptions = (projectId: string) =>
  queryOptions({
    queryKey: ['testRuns', projectId],
    queryFn: () => getTestRunsByProjectId(projectId),
  });
