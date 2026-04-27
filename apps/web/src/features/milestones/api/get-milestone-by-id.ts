'use server';

import * as Sentry from '@sentry/nextjs';
import { getDatabase, milestones, testRuns, testCaseRuns, testCases, milestoneTestCases, milestoneTestSuites, testSuites } from '@testea/db';
import { ActionResult } from '@/shared/types';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { MilestoneStats, MilestoneWithStats } from '@/entities/milestone';

export async function getMilestoneById(milestoneId: string): Promise<ActionResult<MilestoneWithStats>> {
  try {
    const db = getDatabase();

    // 1. 마일스톤 기본 정보 (존재 확인 필요하므로 먼저 실행)
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

    // 2. 병렬 조회: 테스트 실행, 마일스톤 테스트 케이스, 마일스톤 테스트 스위트
    const [relatedTestRuns, mtcRows, mtsRows] = await Promise.all([
      db.select({
        id: testRuns.id,
        name: testRuns.name,
        status: testRuns.status,
        updated_at: testRuns.updated_at,
      }).from(testRuns).where(and(eq(testRuns.milestone_id, milestoneId), eq(testRuns.lifecycle_status, 'ACTIVE'))),
      db.select({ test_case_id: milestoneTestCases.test_case_id })
        .from(milestoneTestCases)
        .where(eq(milestoneTestCases.milestone_id, milestoneId)),
      db.select({ test_suite_id: milestoneTestSuites.test_suite_id })
        .from(milestoneTestSuites)
        .where(eq(milestoneTestSuites.milestone_id, milestoneId)),
    ]);

    // 3. 병렬 조회: 테스트 케이스 실행 결과, 직접 연결된 케이스, ACTIVE 스위트 + 스위트 소속 케이스
    const testRunIds = relatedTestRuns.map(r => r.id);
    const mtcTestCaseIds = mtcRows.map(mtc => mtc.test_case_id).filter(Boolean) as string[];
    const suiteIds = mtsRows.map(mts => mts.test_suite_id).filter(Boolean) as string[];

    const [allTestCaseRuns, directTestCases, suites, suiteCases] = await Promise.all([
      testRunIds.length > 0
        ? db.select({ test_case_id: testCaseRuns.test_case_id, status: testCaseRuns.status })
            .from(testCaseRuns)
            .where(and(inArray(testCaseRuns.test_run_id, testRunIds), isNull(testCaseRuns.excluded_at)))
        : Promise.resolve([]),
      mtcTestCaseIds.length > 0
        ? db.select({ id: testCases.id, case_key: testCases.case_key, name: testCases.name })
            .from(testCases)
            .where(and(inArray(testCases.id, mtcTestCaseIds), eq(testCases.lifecycle_status, 'ACTIVE')))
        : Promise.resolve([]),
      suiteIds.length > 0
        ? db.select({ id: testSuites.id, name: testSuites.name, description: testSuites.description })
            .from(testSuites)
            .where(and(inArray(testSuites.id, suiteIds), eq(testSuites.lifecycle_status, 'ACTIVE')))
        : Promise.resolve([]),
      suiteIds.length > 0
        ? db.select({ id: testCases.id, case_key: testCases.case_key, name: testCases.name })
            .from(testCases)
            .where(and(inArray(testCases.test_suite_id, suiteIds), eq(testCases.lifecycle_status, 'ACTIVE')))
        : Promise.resolve([]),
    ]);

    // 테스트 케이스 맵 구성: 직접 연결 + 스위트 소속 케이스 병합
    const testCaseMap = new Map<string, { id: string; caseKey: string; title: string; lastStatus: string | null }>();

    for (const tc of [...directTestCases, ...suiteCases]) {
      if (!testCaseMap.has(tc.id)) {
        testCaseMap.set(tc.id, {
          id: tc.id,
          caseKey: tc.case_key ?? '',
          title: tc.name,
          lastStatus: null,
        });
      }
    }

    // 테스트 실행 결과로 상태 업데이트
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

    const stats: MilestoneStats = {
      totalCases,
      completedCases,
      progressRate: totalCases > 0 ? Math.round((completedCases / totalCases) * 100) : 0,
      runCount: relatedTestRuns.length,
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
      testSuites: suites.map(s => ({ id: s.id, title: s.name, description: s.description ?? null })),
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
