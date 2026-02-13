'use server';

import * as Sentry from '@sentry/nextjs';
import { getDatabase, testRuns, TestRunStatus } from '@/shared/lib/db';
import { ActionResult } from '@/shared/types';
import { eq } from 'drizzle-orm';

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

export async function getTestRunsByProjectId(projectId: string): Promise<ActionResult<FetchedTestRun[]>> {
  try {
    const db = getDatabase();

    const runs = await db.query.testRuns.findMany({
      where: eq(testRuns.project_id, projectId),
      with: {
        testRunSuites: {
          with: {
            testSuite: true,
          },
        },
        milestone: true,
        testCaseRuns: true,
      },
      orderBy: (testRuns, { desc }) => [desc(testRuns.updated_at)],
    });

    const formattedRuns: FetchedTestRun[] = runs.map(run => {
      let sourceType: FetchedTestRun['sourceType'] = 'ADHOC';
      let sourceName: string = '직접 선택한 케이스';

      if (run.testRunSuites && run.testRunSuites.length > 0) {
        sourceType = 'SUITE';
        sourceName = run.testRunSuites.map(s => s.testSuite?.name || '').join(', ');
      } else if (run.milestone) {
        sourceType = 'MILESTONE';
        sourceName = run.milestone.name || '';
      }

      // Calculate stats from testCaseRuns
      const testCaseRuns = run.testCaseRuns || [];
      const totalCases = testCaseRuns.length;
      const pass = testCaseRuns.filter((tcr) => tcr.status === 'pass').length;
      const fail = testCaseRuns.filter((tcr) => tcr.status === 'fail').length;
      const blocked = testCaseRuns.filter((tcr) => tcr.status === 'blocked').length;
      const untested = testCaseRuns.filter((tcr) => tcr.status === 'untested').length;
      const completedCases = pass + fail + blocked;
      const progressPercent = totalCases > 0 ? Math.round((completedCases / totalCases) * 100) : 0;

      return {
        id: run.id,
        name: run.name,
        description: run.description,
        status: run.status,
        sourceType,
        sourceName,
        updatedAt: run.updated_at,
        stats: {
          totalCases,
          completedCases,
          progressPercent,
          pass,
          fail,
          blocked,
          untested,
        },
      };
    });

    return { success: true, data: formattedRuns };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'getTestRunsByProjectId' } });
    return {
      success: false,
      errors: { _general: ['테스트 실행 목록을 불러오는 중 오류가 발생했습니다.'] },
    };
  }
}
