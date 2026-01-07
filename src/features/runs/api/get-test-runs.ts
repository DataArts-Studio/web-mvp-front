'use server';

import { getDatabase, milestones, testRuns, testRunMilestones, testRunSuites, testSuites, TestRunStatus } from '@/shared/lib/db';
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
        testRunMilestones: {
          with: {
            milestone: true,
          },
        },
      },
      orderBy: (testRuns, { desc }) => [desc(testRuns.updated_at)],
    });

    const formattedRuns: FetchedTestRun[] = runs.map(run => {
      let sourceType: FetchedTestRun['sourceType'] = 'ADHOC';
      let sourceName: string = '직접 선택한 케이스';

      if (run.testRunSuites && run.testRunSuites.length > 0) {
        sourceType = 'SUITE';
        sourceName = run.testRunSuites.map(s => s.testSuite?.name || '').join(', ');
      } else if (run.testRunMilestones && run.testRunMilestones.length > 0) {
        sourceType = 'MILESTONE';
        sourceName = run.testRunMilestones.map(m => m.milestone?.name || '').join(', ');
      }

      return {
        id: run.id,
        name: run.name,
        description: run.description,
        status: run.status,
        sourceType,
        sourceName,
        updatedAt: run.updated_at,
      };
    });

    return { success: true, data: formattedRuns };
  } catch (error) {
    console.error('Error fetching test runs:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      errors: { _general: [`테스트 실행 목록을 불러오는 중 오류가 발생했습니다: ${errorMessage}`] },
    };
  }
}
