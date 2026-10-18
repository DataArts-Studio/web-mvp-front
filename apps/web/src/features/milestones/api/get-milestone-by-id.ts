'use server';

import { ACCESS_DENIED, canAccess } from '@/access/lib/project-scope';
import { MilestoneStats, MilestoneWithStats } from '@/entities/milestone';
import { getMilestoneLatestResults } from '@/entities/milestone/api/latest-results';
import { summarizeMilestoneProgress } from '@/entities/milestone/model/progress';
import { normalizeDateOnly } from '@/shared/lib/date-only';
import { ActionResult } from '@/shared/types';
import * as Sentry from '@sentry/nextjs';
import {
  getDatabase,
  milestoneTestCases,
  milestoneTestSuites,
  milestones,
  testCases,
  testRuns,
  testSuites,
} from '@testea/db';
import { and, eq, inArray } from 'drizzle-orm';

export async function getMilestoneById(
  milestoneId: string
): Promise<ActionResult<MilestoneWithStats>> {
  try {
    if (!(await canAccess('milestone', milestoneId))) return ACCESS_DENIED;

    const db = getDatabase();

    // 1. 마일스톤 기본 정보 (존재 확인 필요하므로 먼저 실행)
    const [dbMilestone] = await db.select().from(milestones).where(eq(milestones.id, milestoneId));

    if (!dbMilestone) {
      return {
        success: false,
        errors: { _general: ['마일스톤을 찾을 수 없습니다.'] },
      };
    }

    // 2. 병렬 조회: 테스트 실행, 마일스톤 테스트 케이스, 마일스톤 테스트 스위트, 케이스별 최근 결과·마지막 실행 시점
    const [relatedTestRuns, mtcRows, mtsRows, latestResults] = await Promise.all([
      db
        .select({
          id: testRuns.id,
          name: testRuns.name,
          status: testRuns.status,
          updated_at: testRuns.updated_at,
        })
        .from(testRuns)
        .where(
          and(eq(testRuns.milestone_id, milestoneId), eq(testRuns.lifecycle_status, 'ACTIVE'))
        ),
      db
        .select({ test_case_id: milestoneTestCases.test_case_id })
        .from(milestoneTestCases)
        .where(eq(milestoneTestCases.milestone_id, milestoneId)),
      db
        .select({ test_suite_id: milestoneTestSuites.test_suite_id })
        .from(milestoneTestSuites)
        .where(eq(milestoneTestSuites.milestone_id, milestoneId)),
      getMilestoneLatestResults(db, [milestoneId]),
    ]);

    const latest = latestResults.get(milestoneId);
    const latestStatuses = latest?.statuses ?? new Map();

    // 3. 병렬 조회: 직접 연결된 케이스, ACTIVE 스위트 + 스위트 소속 케이스
    const mtcTestCaseIds = mtcRows.map((mtc) => mtc.test_case_id).filter(Boolean) as string[];
    const suiteIds = mtsRows.map((mts) => mts.test_suite_id).filter(Boolean) as string[];

    const [directTestCases, suites, suiteCases] = await Promise.all([
      mtcTestCaseIds.length > 0
        ? db
            .select({ id: testCases.id, case_key: testCases.case_key, name: testCases.name })
            .from(testCases)
            .where(
              and(inArray(testCases.id, mtcTestCaseIds), eq(testCases.lifecycle_status, 'ACTIVE'))
            )
        : Promise.resolve([]),
      suiteIds.length > 0
        ? db
            .select({
              id: testSuites.id,
              name: testSuites.name,
              description: testSuites.description,
            })
            .from(testSuites)
            .where(and(inArray(testSuites.id, suiteIds), eq(testSuites.lifecycle_status, 'ACTIVE')))
        : Promise.resolve([]),
      suiteIds.length > 0
        ? db
            .select({ id: testCases.id, case_key: testCases.case_key, name: testCases.name })
            .from(testCases)
            .where(
              and(
                inArray(testCases.test_suite_id, suiteIds),
                eq(testCases.lifecycle_status, 'ACTIVE')
              )
            )
        : Promise.resolve([]),
    ]);

    // 테스트 케이스 맵 구성: 직접 연결 + 스위트 소속 케이스 병합
    const testCaseMap = new Map<
      string,
      { id: string; caseKey: string; title: string; lastStatus: string | null }
    >();

    for (const tc of [...directTestCases, ...suiteCases]) {
      if (!testCaseMap.has(tc.id)) {
        testCaseMap.set(tc.id, {
          id: tc.id,
          caseKey: tc.case_key ?? '',
          title: tc.name,
          // 케이스마다 이 마일스톤 실행의 가장 최근 결과 (#418)
          lastStatus: latestStatuses.get(tc.id) ?? null,
        });
      }
    }

    const testCasesResult = Array.from(testCaseMap.values());
    const progress = summarizeMilestoneProgress(testCaseMap.keys(), latestStatuses);

    const stats: MilestoneStats = {
      totalCases: progress.total,
      completedCases: progress.completed,
      progressRate: progress.progressPercent,
      runCount: relatedTestRuns.length,
      passCases: progress.pass,
      failCases: progress.fail,
      blockedCases: progress.blocked,
      suiteCount: suites.length,
    };

    const result: MilestoneWithStats = {
      id: dbMilestone.id,
      projectId: dbMilestone.project_id ?? '',
      title: dbMilestone.name,
      description: dbMilestone.description ?? undefined,
      startDate: normalizeDateOnly(dbMilestone.start_date),
      endDate: normalizeDateOnly(dbMilestone.end_date),
      progressStatus: dbMilestone.progress_status,
      createdAt: dbMilestone.created_at,
      updatedAt: dbMilestone.updated_at,
      archivedAt: dbMilestone.archived_at,
      lifecycleStatus: dbMilestone.lifecycle_status,
      lastExecutedAt: latest?.lastExecutedAt ?? null,
      ...stats,
      testCases: testCasesResult,
      testSuites: suites.map((s) => ({
        id: s.id,
        title: s.name,
        description: s.description ?? null,
      })),
      testRuns: relatedTestRuns.map((run) => ({
        id: run.id,
        name: run.name,
        status: run.status,
        updatedAt: run.updated_at,
      })),
    };

    return { success: true, data: result };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'getMilestoneById' } });
    return {
      success: false,
      errors: {
        _general: ['마일스톤을 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'],
      },
    };
  }
}
