// src/features/runs/api/query.ts
import { queryOptions } from '@tanstack/react-query';

import { getTestRunById } from './get-test-run-by-id';
import { getTestRunsByProjectId } from './get-test-runs';

export const testRunsQueryOptions = (projectId: string) =>
  queryOptions({
    queryKey: ['testRuns', projectId],
    queryFn: () => getTestRunsByProjectId(projectId),
  });

export const testRunByIdQueryOptions = (testRunId: string) =>
  queryOptions({
    queryKey: ['testRun', testRunId],
    queryFn: () => getTestRunById(testRunId),
  });
