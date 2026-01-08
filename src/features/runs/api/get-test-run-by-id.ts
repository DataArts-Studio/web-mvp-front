'use server';

import { getDatabase, testRuns, testCaseRuns, testCases, TestRunStatus, TestCaseRunStatus } from '@/shared/lib/db';
import { ActionResult } from '@/shared/types';
import { eq } from 'drizzle-orm';

export interface TestCaseRunDetail {
  id: string;
  testCaseId: string;
  code: string;
  title: string;
  status: TestCaseRunStatus;
  comment: string | null;
  executedAt: Date | null;
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
  stats: {
    total: number;
    untested: number;
    pass: number;
    fail: number;
    blocked: number;
    progressPercent: number;
  };
}

export async function getTestRunById(testRunId: string): Promise<ActionResult<TestRunDetail>> {
  try {
    const db = getDatabase();

    const run = await db.query.testRuns.findFirst({
      where: eq(testRuns.id, testRunId),
      with: {
        testCaseRuns: {
          with: {
            testCase: true,
          },
        },
        testRunSuites: {
          with: {
            testSuite: true,
          },
        },
        testRunMilestones: {
          with: {
            milestone: true,
          },
        },
      },
    });

    if (!run) {
      return {
        success: false,
        errors: { _general: ['테스트 실행을 찾을 수 없습니다.'] },
      };
    }

    // Determine source type and name
    let sourceType: TestRunDetail['sourceType'] = 'ADHOC';
    let sourceName = '직접 선택한 케이스';

    if (run.testRunSuites && run.testRunSuites.length > 0) {
      sourceType = 'SUITE';
      sourceName = run.testRunSuites.map(s => s.testSuite?.name || '').filter(Boolean).join(', ');
    } else if (run.testRunMilestones && run.testRunMilestones.length > 0) {
      sourceType = 'MILESTONE';
      sourceName = run.testRunMilestones.map(m => m.milestone?.name || '').filter(Boolean).join(', ');
    }

    // Map test case runs
    const testCaseRunDetails: TestCaseRunDetail[] = (run.testCaseRuns || []).map(tcr => ({
      id: tcr.id,
      testCaseId: tcr.test_case_id || '',
      code: tcr.testCase?.code || '',
      title: tcr.testCase?.title || '',
      status: tcr.status,
      comment: tcr.comment,
      executedAt: tcr.executed_at,
    }));

    // Calculate stats
    const total = testCaseRunDetails.length;
    const untested = testCaseRunDetails.filter(tc => tc.status === 'untested').length;
    const pass = testCaseRunDetails.filter(tc => tc.status === 'pass').length;
    const fail = testCaseRunDetails.filter(tc => tc.status === 'fail').length;
    const blocked = testCaseRunDetails.filter(tc => tc.status === 'blocked').length;
    const completed = pass + fail + blocked;
    const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    const result: TestRunDetail = {
      id: run.id,
      name: run.name,
      description: run.description,
      status: run.status,
      sourceType,
      sourceName,
      createdAt: run.created_at,
      updatedAt: run.updated_at,
      testCaseRuns: testCaseRunDetails,
      stats: {
        total,
        untested,
        pass,
        fail,
        blocked,
        progressPercent,
      },
    };

    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching test run:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      errors: { _general: [`테스트 실행을 불러오는 중 오류가 발생했습니다: ${errorMessage}`] },
    };
  }
}
