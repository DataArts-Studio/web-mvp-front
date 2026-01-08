// src/features/runs/api/query.ts
import { queryOptions } from '@tanstack/react-query';
import { getTestRunsByProjectId } from './get-test-runs';
import { getTestRunById } from './get-test-run-by-id';

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
