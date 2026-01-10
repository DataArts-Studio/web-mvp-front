'use server';

import { getDatabase, milestones, testRunMilestones, testRuns, testCaseRuns } from '@/shared/lib/db';
import { ActionResult } from '@/shared/types';
import { eq, and, sql } from 'drizzle-orm';

export interface MilestoneDetail {
  id: string;
  title: string;
  description: string | null;
  startDate: Date | null;
  endDate: Date | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  stats: {
    totalCases: number;
    completedCases: number;
    progressRate: number;
    runCount: number;
  };
  testCases: Array<{
    id: string;
    code: string;
    title: string;
    lastStatus: string | null;
  }>;
  testRuns: Array<{
    id: string;
    name: string;
    status: string;
    updatedAt: Date;
  }>;
}

export async function getMilestoneById(milestoneId: string): Promise<ActionResult<MilestoneDetail>> {
  try {
    const db = getDatabase();

    const milestone = await db.query.milestones.findFirst({
      where: eq(milestones.id, milestoneId),
      with: {
        testRunMilestones: {
          with: {
            testRun: {
              with: {
                testCaseRuns: {
                  with: {
                    testCase: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!milestone) {
      return {
        success: false,
        errors: { _general: ['마일스톤을 찾을 수 없습니다.'] },
      };
    }

    // Get test runs for this milestone
    const relatedTestRuns = milestone.testRunMilestones?.map(trm => trm.testRun).filter(Boolean) || [];

    // Collect all unique test cases from test runs
    const testCaseMap = new Map<string, { id: string; code: string; title: string; lastStatus: string | null }>();

    for (const run of relatedTestRuns) {
      if (run?.testCaseRuns) {
        for (const tcr of run.testCaseRuns) {
          if (tcr.testCase && !testCaseMap.has(tcr.testCase.id)) {
            testCaseMap.set(tcr.testCase.id, {
              id: tcr.testCase.id,
              code: tcr.testCase.code,
              title: tcr.testCase.title,
              lastStatus: tcr.status,
            });
          }
        }
      }
    }

    const testCases = Array.from(testCaseMap.values());

    // Calculate stats
    const totalCases = testCases.length;
    const completedCases = testCases.filter(tc => tc.lastStatus && tc.lastStatus !== 'untested').length;
    const progressRate = totalCases > 0 ? Math.round((completedCases / totalCases) * 100) : 0;
    const runCount = relatedTestRuns.length;

    const result: MilestoneDetail = {
      id: milestone.id,
      title: milestone.name,
      description: milestone.description,
      startDate: milestone.start_date,
      endDate: milestone.end_date,
      status: milestone.status,
      createdAt: milestone.created_at,
      updatedAt: milestone.updated_at,
      stats: {
        totalCases,
        completedCases,
        progressRate,
        runCount,
      },
      testCases,
      testRuns: relatedTestRuns.map(run => ({
        id: run!.id,
        name: run!.name,
        status: run!.status,
        updatedAt: run!.updated_at,
      })),
    };

    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching milestone:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      errors: { _general: [`마일스톤을 불러오는 중 오류가 발생했습니다: ${errorMessage}`] },
    };
  }
}
