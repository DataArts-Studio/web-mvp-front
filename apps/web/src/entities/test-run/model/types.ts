import { z } from 'zod';

import { CreateTestRunSchema, TestRunSchema, TestRunStatusEnum } from './schema';

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
  /** 같은 출처(마일스톤 또는 같은 스위트 묶음)로 만든 실행끼리 같은 값. 직접 고른 케이스는 null. */
  sourceKey: string | null;
  milestoneEndDate: string | null;
  createdAt: Date;
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
  /** 결과를 기록한 날(서비스 시간대 'YYYY-MM-DD')별 건수. */
  activity: { date: string; pass: number; fail: number; blocked: number }[];
}

/** 끝난 실행 화면의 직전 실행 비교 데이터 (리뉴얼 v2 06f2) */
export interface RunComparison {
  previous: { id: string; name: string; createdAt: Date; passRate: number | null } | null;
  /** test_case_id 별 직전 실행 결과 */
  previousByCase: Record<
    string,
    {
      status: import('@testea/db').TestCaseRunStatus;
      comment: string | null;
      executedAt: Date | null;
    }
  >;
  /** test_case_id 별 최근 결과(오래된 것부터, 최대 5개). 미실행은 빠진다. */
  historyByCase: Record<
    string,
    { status: import('@testea/db').TestCaseRunStatus; executedAt: Date; runId: string }[]
  >;
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
