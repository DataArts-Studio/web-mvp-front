'use server';

import { ACCESS_DENIED, belongsToProject, canAccess } from '@/access/lib/project-scope';
import { getMilestoneLatestResults } from '@/entities/milestone/api/latest-results';
import {
  type MilestoneProgress,
  summarizeMilestoneProgress,
} from '@/entities/milestone/model/progress';
import { ActionResult } from '@/shared/types';
import * as Sentry from '@sentry/nextjs';
import {
  getDatabase,
  milestoneTestCases,
  milestoneTestSuites,
  milestones,
  testCaseRuns,
  testCases,
  testRuns,
  testSuites,
} from '@testea/db';
import { and, eq, inArray, isNull } from 'drizzle-orm';

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

function toStats(progress: MilestoneProgress): DashboardMilestone['stats'] {
  const { total, pass, fail, blocked, untested, progressPercent } = progress;
  return { total, pass, fail, blocked, untested, progressPercent };
}

function calcProgress(rows: { status: string }[]) {
  let pass = 0,
    fail = 0,
    blocked = 0,
    untested = 0;
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
    if (!(await canAccess('project', projectId))) return ACCESS_DENIED;
    // 실행 ID 가 주어지면 같은 프로젝트 소속이어야 한다 (남의 실행에 연결된 마일스톤 조회 차단).
    if (testRunId && !(await belongsToProject('testRun', testRunId, projectId))) {
      return ACCESS_DENIED;
    }

    const db = getDatabase();

    // 1. 마일스톤 목록 결정
    let milestoneIds: string[];

    if (testRunId) {
      // 선택된 테스트 실행에 연결된 마일스톤만
      const linked = await db
        .select({ milestone_id: testRuns.milestone_id })
        .from(testRuns)
        .where(eq(testRuns.id, testRunId));
      milestoneIds = linked.map((r) => r.milestone_id).filter(Boolean) as string[];
    } else {
      // 전체 활성 마일스톤
      const all = await db
        .select({ id: milestones.id })
        .from(milestones)
        .where(
          and(eq(milestones.project_id, projectId), eq(milestones.lifecycle_status, 'ACTIVE'))
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
      .where(and(inArray(milestones.id, milestoneIds), eq(milestones.lifecycle_status, 'ACTIVE')));

    // 3. 각 마일스톤별 스위트 + 진행률 계산
    // 실행을 고르지 않은 전체 보기는 목록·상세와 같은 기준(케이스별 가장 최근 결과)으로 센다 (#418).
    const latestResults = testRunId
      ? null
      : await getMilestoneLatestResults(
          db,
          milestoneRows.map((m) => m.id)
        );

    const result: DashboardMilestone[] = await Promise.all(
      milestoneRows.map(async (m) => {
        // 3a. 마일스톤에 연결된 스위트 조회
        const suiteLinks = await db
          .select({
            suiteId: milestoneTestSuites.test_suite_id,
            suiteName: testSuites.name,
          })
          .from(milestoneTestSuites)
          .innerJoin(testSuites, eq(testSuites.id, milestoneTestSuites.test_suite_id))
          .where(eq(milestoneTestSuites.milestone_id, m.id));

        const base = {
          id: m.id,
          name: m.name,
          startDate: m.start_date ?? null,
          endDate: m.end_date ?? null,
          progressStatus: m.progress_status,
        };

        if (latestResults) {
          const statuses = latestResults.get(m.id)?.statuses ?? new Map();
          const suiteIds = suiteLinks.map((s) => s.suiteId);
          const [directCases, suiteCases] = await Promise.all([
            db
              .select({ id: testCases.id })
              .from(milestoneTestCases)
              .innerJoin(testCases, eq(testCases.id, milestoneTestCases.test_case_id))
              .where(
                and(
                  eq(milestoneTestCases.milestone_id, m.id),
                  eq(testCases.lifecycle_status, 'ACTIVE')
                )
              ),
            suiteIds.length > 0
              ? db
                  .select({ id: testCases.id, suiteId: testCases.test_suite_id })
                  .from(testCases)
                  .where(
                    and(
                      inArray(testCases.test_suite_id, suiteIds),
                      eq(testCases.lifecycle_status, 'ACTIVE')
                    )
                  )
              : Promise.resolve([]),
          ]);

          const caseIds = [...directCases, ...suiteCases].map((c) => c.id);
          return {
            ...base,
            suites: suiteLinks.map((s) => ({
              id: s.suiteId,
              name: s.suiteName,
              stats: toStats(
                summarizeMilestoneProgress(
                  suiteCases.filter((c) => c.suiteId === s.suiteId).map((c) => c.id),
                  statuses
                )
              ),
            })),
            stats: toStats(summarizeMilestoneProgress(caseIds, statuses)),
          };
        }

        // 3b. 선택한 실행 안의 케이스 실행 결과
        const caseRunRows = await db
          .select({
            status: testCaseRuns.status,
            source_type: testCaseRuns.source_type,
            source_id: testCaseRuns.source_id,
          })
          .from(testCaseRuns)
          .where(and(eq(testCaseRuns.test_run_id, testRunId!), isNull(testCaseRuns.excluded_at)));

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

        return { ...base, suites, stats: calcProgress(milestoneDirectRuns) };
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
