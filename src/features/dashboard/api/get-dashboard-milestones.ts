'use server';

import * as Sentry from '@sentry/nextjs';
import {
  getDatabase,
  milestones,
  testRuns,
  testCaseRuns,
  milestoneTestSuites,
  testSuites,
} from '@/shared/lib/db';
import { ActionResult } from '@/shared/types';
import { and, eq, inArray, sql } from 'drizzle-orm';

export interface DashboardMilestoneSuite {
  id: string;
  name: string;
  stats: {
    total: number;
    pass: number;
    fail: number;
    blocked: number;
    untested: number;
    progressPercent: number;
  };
}

export interface DashboardMilestone {
  id: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  progressStatus: string;
  suites: DashboardMilestoneSuite[];
  stats: {
    total: number;
    pass: number;
    fail: number;
    blocked: number;
    untested: number;
    progressPercent: number;
  };
}

function calcProgress(rows: { status: string }[]) {
  let pass = 0, fail = 0, blocked = 0, untested = 0;
  for (const r of rows) {
    if (r.status === 'pass') pass++;
    else if (r.status === 'fail') fail++;
    else if (r.status === 'blocked') blocked++;
    else untested++;
  }
  const total = rows.length;
  const completed = pass + fail + blocked;
  return {
    total,
    pass,
    fail,
    blocked,
    untested,
    progressPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

export async function getDashboardMilestones(
  projectId: string,
  testRunId?: string
): Promise<ActionResult<DashboardMilestone[]>> {
  try {
    const db = getDatabase();

    // 1. 마일스톤 목록 결정
    let milestoneIds: string[];

    if (testRunId) {
      // 선택된 테스트 실행에 연결된 마일스톤만
      const linked = await db
        .select({ milestone_id: testRuns.milestone_id })
        .from(testRuns)
        .where(eq(testRuns.id, testRunId));
      milestoneIds = linked
        .map((r) => r.milestone_id)
        .filter(Boolean) as string[];
    } else {
      // 전체 활성 마일스톤
      const all = await db
        .select({ id: milestones.id })
        .from(milestones)
        .where(
          and(
            eq(milestones.project_id, projectId),
            eq(milestones.lifecycle_status, 'ACTIVE')
          )
        );
      milestoneIds = all.map((r) => r.id);
    }

    if (milestoneIds.length === 0) {
      return { success: true, data: [] };
    }

    // 2. 마일스톤 기본 정보 조회
    const milestoneRows = await db
      .select()
      .from(milestones)
      .where(
        and(
          inArray(milestones.id, milestoneIds),
          eq(milestones.lifecycle_status, 'ACTIVE')
        )
      );

    // 3. 각 마일스톤별 스위트 + 진행률 계산
    const result: DashboardMilestone[] = await Promise.all(
      milestoneRows.map(async (m) => {
        // 3a. 마일스톤에 연결된 스위트 조회
        const suiteLinks = await db
          .select({
            suiteId: milestoneTestSuites.test_suite_id,
            suiteName: testSuites.name,
          })
          .from(milestoneTestSuites)
          .innerJoin(
            testSuites,
            eq(testSuites.id, milestoneTestSuites.test_suite_id)
          )
          .where(eq(milestoneTestSuites.milestone_id, m.id));

        // 3b. 이 마일스톤 관련 testCaseRuns 조회
        let caseRunRows: { status: string; source_type: string | null; source_id: string | null }[];

        if (testRunId) {
          // 특정 실행 내에서만
          caseRunRows = await db
            .select({
              status: testCaseRuns.status,
              source_type: testCaseRuns.source_type,
              source_id: testCaseRuns.source_id,
            })
            .from(testCaseRuns)
            .where(eq(testCaseRuns.test_run_id, testRunId));
        } else {
          // 마일스톤에 연결된 모든 실행에서
          const runRows = await db
            .select({ id: testRuns.id })
            .from(testRuns)
            .where(eq(testRuns.milestone_id, m.id));

          const ids = runRows.map((r) => r.id);
          if (ids.length === 0) {
            return {
              id: m.id,
              name: m.name,
              startDate: m.start_date ?? null,
              endDate: m.end_date ?? null,
              progressStatus: m.progress_status,
              suites: suiteLinks.map((s) => ({
                id: s.suiteId,
                name: s.suiteName,
                stats: { total: 0, pass: 0, fail: 0, blocked: 0, untested: 0, progressPercent: 0 },
              })),
              stats: { total: 0, pass: 0, fail: 0, blocked: 0, untested: 0, progressPercent: 0 },
            };
          }

          caseRunRows = await db
            .select({
              status: testCaseRuns.status,
              source_type: testCaseRuns.source_type,
              source_id: testCaseRuns.source_id,
            })
            .from(testCaseRuns)
            .where(inArray(testCaseRuns.test_run_id, ids));
        }

        // 3c. 스위트별 진행률 (source_type='suite' + source_id=suiteId)
        const suiteIdSet = new Set(suiteLinks.map((s) => s.suiteId));
        const milestoneDirectRuns = caseRunRows.filter(
          (r) =>
            (r.source_type === 'milestone' && r.source_id === m.id) ||
            (r.source_type === 'suite' && r.source_id && suiteIdSet.has(r.source_id))
        );

        const suites: DashboardMilestoneSuite[] = suiteLinks.map((s) => {
          const suiteRuns = caseRunRows.filter(
            (r) => r.source_type === 'suite' && r.source_id === s.suiteId
          );
          return {
            id: s.suiteId,
            name: s.suiteName,
            stats: calcProgress(suiteRuns),
          };
        });

        return {
          id: m.id,
          name: m.name,
          startDate: m.start_date ?? null,
          endDate: m.end_date ?? null,
          progressStatus: m.progress_status,
          suites,
          stats: calcProgress(milestoneDirectRuns),
        };
      })
    );

    return { success: true, data: result };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'getDashboardMilestones' } });
    return {
      success: false,
      errors: {
        _milestone: ['마일스톤 데이터를 불러오는 중 오류가 발생했습니다.'],
      },
    };
  }
}
