import { z } from 'zod';

import { CreateTestSuiteDtoSchema, CreateTestSuiteSchema, TestSuiteDtoSchema } from './schema';
export type TestSuiteDTO = z.infer<typeof TestSuiteDtoSchema>;
export type CreateTestSuiteDTO = z.infer<typeof CreateTestSuiteDtoSchema>;
export type CreateTestSuite = z.infer<typeof CreateTestSuiteSchema>;

export type TestSuite = {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type SuiteTagTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type RunStatus = 'passed' | 'failed' | 'blocked' | 'running' | 'not_run';

export type TestSuiteCard = TestSuite & {
  tag: {
    label: string;
    tone: SuiteTagTone;
  };

  includedPaths: string[];
  caseCount: number;

  linkedMilestone?: {
    id: string;
    title: string;
    versionLabel: string;
  };

  lastRun?: {
    runId: string;
    runAt: Date;
    status: RunStatus;
    counts: {
      passed: number;
      failed: number;
      blocked: number;
      skipped: number;
    };
    total: number;
  };

  executionHistoryCount: number;

  recentRuns: Array<{
    runId: string;
    runAt: Date;
    status: RunStatus;
    failed: number;
    blocked: number;
    passed: number;
    total: number;
  }>;
};
