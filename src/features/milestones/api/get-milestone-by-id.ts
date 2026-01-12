'use server';

import { getDatabase, milestones } from '@/shared/lib/db';
import { ActionResult } from '@/shared/types';
import { eq } from 'drizzle-orm';
import { Milestone, MilestoneStats, MilestoneWithStats } from '@/entities/milestone';

export async function getMilestoneById(milestoneId: string): Promise<ActionResult<MilestoneWithStats>> {
  try {
    const db = getDatabase();

    const dbMilestone = await db.query.milestones.findFirst({
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
        milestoneTestCases: {
          with: {
            testCase: true,
          },
        },
      },
    });

    if (!dbMilestone) {
      return {
        success: false,
        errors: { _general: ['마일스톤을 찾을 수 없습니다.'] },
      };
    }

    const relatedTestRuns = dbMilestone.testRunMilestones?.map(trm => trm.testRun).filter(Boolean) || [];
    const testCaseMap = new Map<string, { id: string; caseKey: string; title: string; lastStatus: string | null }>();

    // milestone_test_cases 테이블에서 직접 연결된 테스트 케이스 가져오기
    const directTestCases = dbMilestone.milestoneTestCases?.map(mtc => mtc.testCase).filter(Boolean) || [];
    for (const tc of directTestCases) {
      if (tc && !testCaseMap.has(tc.id)) {
        testCaseMap.set(tc.id, {
          id: tc.id,
          caseKey: tc.case_key ?? '',
          title: tc.name,
          lastStatus: null,
        });
      }
    }

    // 테스트 실행에서 상태 업데이트
    for (const run of relatedTestRuns) {
      if (run?.testCaseRuns) {
        for (const tcr of run.testCaseRuns) {
          if (tcr.testCase) {
            const existing = testCaseMap.get(tcr.testCase.id);
            if (existing) {
              existing.lastStatus = tcr.status;
            }
          }
        }
      }
    }

    const testCases = Array.from(testCaseMap.values());
    const totalCases = testCases.length;
    const completedCases = testCases.filter(tc => tc.lastStatus && tc.lastStatus !== 'untested').length;
    const progressRate = totalCases > 0 ? Math.round((completedCases / totalCases) * 100) : 0;
    const runCount = relatedTestRuns.length;

    const stats: MilestoneStats = {
      totalCases,
      completedCases,
      progressRate,
      runCount,
    };

    const result: MilestoneWithStats = {
      id: dbMilestone.id,
      projectId: dbMilestone.project_id ?? '',
      title: dbMilestone.name,
      description: dbMilestone.description ?? undefined,
      startDate: dbMilestone.start_date ? new Date(dbMilestone.start_date) : null,
      endDate: dbMilestone.end_date ? new Date(dbMilestone.end_date) : null,
      progressStatus: dbMilestone.progress_status,
      createdAt: dbMilestone.created_at,
      updatedAt: dbMilestone.updated_at,
      archivedAt: dbMilestone.archived_at,
      lifecycleStatus: dbMilestone.lifecycle_status,
      ...stats,
      testCases,
      testRuns: relatedTestRuns.map(run => ({
        id: run?.id,
        name: run?.name,
        status: run?.status,
        updatedAt: run?.updated_at,
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
