// src/features/runs/api/query.ts
import { queryOptions } from '@tanstack/react-query';

import { getRunComparison } from './get-run-comparison';
import { getRunIssueContext } from './get-run-issue-context';
import { getTestRunById } from './get-test-run-by-id';
import { getTestRunsByProjectId } from './get-test-runs';

export const testRunsQueryOptions = (projectId: string) =>
  queryOptions({
    queryKey: ['testRuns', projectId],
    queryFn: () => getTestRunsByProjectId(projectId),
  });

export const runComparisonQueryOptions = (testRunId: string) =>
  queryOptions({
    queryKey: ['testRun', testRunId, 'comparison'],
    queryFn: () => getRunComparison(testRunId),
  });

export const runIssueContextQueryOptions = (testRunId: string) =>
  queryOptions({
    queryKey: ['testRun', testRunId, 'issues'],
    queryFn: () => getRunIssueContext(testRunId),
  });

export const testRunByIdQueryOptions = (testRunId: string) =>
  queryOptions({
    queryKey: ['testRun', testRunId],
    queryFn: () => getTestRunById(testRunId),
  });
