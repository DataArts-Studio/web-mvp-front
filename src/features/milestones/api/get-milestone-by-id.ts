'use server';

import * as Sentry from '@sentry/nextjs';
import { getDatabase, milestones, testRuns, testCaseRuns, testCases, milestoneTestCases, milestoneTestSuites, testSuites } from '@/shared/lib/db';
import { ActionResult } from '@/shared/types';
import { eq, inArray } from 'drizzle-orm';
import { MilestoneStats, MilestoneWithStats } from '@/entities/milestone';

export async function getMilestoneById(milestoneId: string): Promise<ActionResult<MilestoneWithStats>> {
  try {
    const db = getDatabase();

    // 1. 마일스톤 기본 정보
    const [dbMilestone] = await db
      .select()
      .from(milestones)
      .where(eq(milestones.id, milestoneId));

    if (!dbMilestone) {
      return {
        success: false,
        errors: { _general: ['마일스톤을 찾을 수 없습니다.'] },
      };
    }

    // 2. 테스트 실행 목록
    const relatedTestRuns = await db
      .select()
      .from(testRuns)
      .where(eq(testRuns.milestone_id, milestoneId));

    // 3. 테스트 케이스 실행 결과 (테스트 실행이 있을 때만)
    const testRunIds = relatedTestRuns.map(r => r.id);
    const allTestCaseRuns = testRunIds.length > 0
      ? await db
          .select()
          .from(testCaseRuns)
          .where(inArray(testCaseRuns.test_run_id, testRunIds))
      : [];

    // 4. 테스트 케이스 실행에서 참조하는 테스트 케이스
    const tcrTestCaseIds = [...new Set(allTestCaseRuns.map(tcr => tcr.test_case_id).filter(Boolean))] as string[];
    const tcrTestCases = tcrTestCaseIds.length > 0
      ? await db.select().from(testCases).where(inArray(testCases.id, tcrTestCaseIds))
      : [];
    const tcrTestCaseMap = new Map(tcrTestCases.map(tc => [tc.id, tc]));

    // 5. 마일스톤에 직접 연결된 테스트 케이스
    const mtcRows = await db
      .select()
      .from(milestoneTestCases)
      .where(eq(milestoneTestCases.milestone_id, milestoneId));

    const mtcTestCaseIds = mtcRows.map(mtc => mtc.test_case_id).filter(Boolean) as string[];
    const directTestCases = mtcTestCaseIds.length > 0
      ? await db.select().from(testCases).where(inArray(testCases.id, mtcTestCaseIds))
      : [];

    // 6. 마일스톤에 연결된 테스트 스위트
    let testSuitesList: Array<{ id: string; title: string; description: string | null }> = [];
    try {
      const mtsRows = await db
        .select()
        .from(milestoneTestSuites)
        .where(eq(milestoneTestSuites.milestone_id, milestoneId));

      const suiteIds = mtsRows.map(mts => mts.test_suite_id).filter(Boolean) as string[];
      if (suiteIds.length > 0) {
        const suites = await db.select().from(testSuites).where(inArray(testSuites.id, suiteIds));
        testSuitesList = suites.map(s => ({ id: s.id, title: s.name, description: s.description ?? null }));
      }
    } catch (e) {
      console.warn('milestoneTestSuites 조회 실패:', e);
    }

    // 테스트 케이스 맵 구성
    const testCaseMap = new Map<string, { id: string; caseKey: string; title: string; lastStatus: string | null }>();

    for (const tc of directTestCases) {
      if (!testCaseMap.has(tc.id)) {
        testCaseMap.set(tc.id, {
          id: tc.id,
          caseKey: tc.case_key ?? '',
          title: tc.name,
          lastStatus: null,
        });
      }
    }

    // 테스트 실행에서 상태 업데이트
    for (const tcr of allTestCaseRuns) {
      if (tcr.test_case_id) {
        const existing = testCaseMap.get(tcr.test_case_id);
        if (existing) {
          existing.lastStatus = tcr.status;
        }
      }
    }

    const testCasesResult = Array.from(testCaseMap.values());
    const totalCases = testCasesResult.length;
    const completedCases = testCasesResult.filter(tc => tc.lastStatus && tc.lastStatus !== 'untested').length;
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
      testCases: testCasesResult,
      testSuites: testSuitesList,
      testRuns: relatedTestRuns.map(run => ({
        id: run.id,
        name: run.name,
        status: run.status,
        updatedAt: run.updated_at,
      })),
    };

    return { success: true, data: result };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'getMilestoneById' } });
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      errors: { _general: [`마일스톤을 불러오는 중 오류가 발생했습니다: ${errorMessage}`] },
    };
  }
}
