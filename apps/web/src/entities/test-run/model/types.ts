import { z } from 'zod';
import {
  CreateTestRunSchema,
  TestRunSchema,
  TestRunStatusEnum,
} from './schema';

export type TestRunDTO = z.infer<typeof TestRunSchema>;
export type CreateTestRunDTO = z.infer<typeof CreateTestRunSchema>;
export type CreateTestRunInput = z.infer<typeof CreateTestRunSchema>;
export type TestRunStatus = z.infer<typeof TestRunStatusEnum>;
export type TestRunSourceType = 'suite' | 'milestone' | 'adhoc' | 'manual';

// ─── Test Run Detail (View/API DTO) ─────────────────────────────

export interface TestCaseRunDetail {
  id: string;
  testCaseId: string;
  code: string;
  title: string;
  status: import('@testea/db').TestCaseRunStatus;
  comment: string | null;
  executedAt: Date | null;
  sourceType: import('@testea/db').TestCaseRunSourceType;
  sourceId: string | null;
  sourceName: string | null;
  testSuiteId: string | null;
  testSuiteName: string | null;
  preCondition: string | null;
  steps: string | null;
  expectedResult: string | null;
}

export interface SourceInfo {
  id: string;
  name: string;
  type: 'suite' | 'milestone';
}

export interface TestRunDetail {
  id: string;
  name: string;
  description: string | null;
  status: TestRunStatus;
  sourceType: 'SUITE' | 'MILESTONE' | 'ADHOC';
  sourceName: string;
  createdAt: Date;
  updatedAt: Date;
  testCaseRuns: TestCaseRunDetail[];
  sources: SourceInfo[];
  shareToken: string | null;
  shareExpiresAt: Date | null;
  stats: {
    total: number;
    untested: number;
    pass: number;
    fail: number;
    blocked: number;
    progressPercent: number;
  };
}

export interface FetchedTestRun {
  id: string;
  name: string;
  description?: string | null;
  status: TestRunStatus;
  sourceType: 'SUITE' | 'MILESTONE' | 'ADHOC';
  sourceName: string;
  updatedAt: Date;
  stats: {
    totalCases: number;
    completedCases: number;
    progressPercent: number;
    pass: number;
    fail: number;
    blocked: number;
    untested: number;
  };
}

export interface UpdateTestCaseRunInput {
  testCaseRunId: string;
  status: import('@testea/db').TestCaseRunStatus;
  comment?: string | null;
}

export interface UpdateTestCaseRunResult {
  id: string;
  status: import('@testea/db').TestCaseRunStatus;
  comment: string | null;
  executedAt: Date | null;
}