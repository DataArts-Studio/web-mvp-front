'use server';

import * as Sentry from '@sentry/nextjs';
import type { DashboardStats, ProjectInfo, RecentActivity, TestCaseStats, TestSuiteSummary } from '@/features';
import { getDatabase, projects, suiteTestCases, testCases, testSuites } from '@/shared/lib/db';
import { and, count, desc, eq, inArray, notInArray } from 'drizzle-orm';
import { ActionResult } from '@/shared/types';

type GetDashboardStatsParams = {
  slug: string;
};

export const getDashboardStats = async ({
  slug,
}: GetDashboardStatsParams): Promise<ActionResult<DashboardStats>> => {
  try {
    const db = getDatabase();

    // URL 인코딩된 slug를 디코딩
    const decodedSlug = decodeURIComponent(slug);

    // 프로젝트 정보 조회 (디코딩된 slug로 검색)
    const [projectRow] = await db
      .select()
      .from(projects)
      .where(eq(projects.name, decodedSlug))
      .limit(1);

    if (!projectRow) {
      return {
        success: false,
        errors: { _project: ['프로젝트를 찾을 수 없습니다.'] },
      };
    }

    const projectInfo: ProjectInfo = {
      id: projectRow.id,
      name: projectRow.name,
      description: projectRow.description ?? '',
      ownerName: projectRow.owner_name ?? '',
      created_at: projectRow.created_at.toISOString(),
    };

    const assignedTestCasesSubquery = db
      .select({ id: suiteTestCases.test_case_id })
      .from(suiteTestCases);

    // 5개 독립 쿼리를 Promise.all로 병렬 실행
    const [
      [testCaseCountResult],
      [unassignedCountResult],
      suiteRows,
      recentTestCases,
      recentSuites,
    ] = await Promise.all([
      db.select({ count: count() })
        .from(testCases)
        .where(eq(testCases.project_id, projectRow.id)),
      db.select({ count: count() })
        .from(testCases)
        .where(
          and(
            eq(testCases.project_id, projectRow.id),
            notInArray(testCases.id, assignedTestCasesSubquery)
          )
        ),
      db.select({
          id: testSuites.id,
          name: testSuites.name,
          description: testSuites.description,
        })
        .from(testSuites)
        .where(eq(testSuites.project_id, projectRow.id)),
      db.select({
          id: testCases.id,
          title: testCases.name,
          created_at: testCases.created_at,
        })
        .from(testCases)
        .where(eq(testCases.project_id, projectRow.id))
        .orderBy(desc(testCases.created_at))
        .limit(5),
      db.select({
          id: testSuites.id,
          title: testSuites.name,
          created_at: testSuites.created_at,
        })
        .from(testSuites)
        .where(eq(testSuites.project_id, projectRow.id))
        .orderBy(desc(testSuites.created_at))
        .limit(5),
    ]);

    const testCaseStats: TestCaseStats = {
      total: testCaseCountResult?.count ?? 0,
      unassigned: unassignedCountResult?.count ?? 0,
    };

    // 스위트별 케이스 수: N+1 → 단일 GROUP BY 쿼리로 해결
    let caseCountMap = new Map<string, number>();
    if (suiteRows.length > 0) {
      const suiteIds = suiteRows.map((r) => r.id);
      const caseCountRows = await db
        .select({ suiteId: suiteTestCases.suite_id, cnt: count() })
        .from(suiteTestCases)
        .where(inArray(suiteTestCases.suite_id, suiteIds))
        .groupBy(suiteTestCases.suite_id);
      caseCountMap = new Map(caseCountRows.map((r) => [r.suiteId, Number(r.cnt)]));
    }

    const testSuitesResult: TestSuiteSummary[] = suiteRows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description ?? '',
      case_count: caseCountMap.get(row.id) ?? 0,
    }));

    // 최근 활동 합치기 및 정렬
    const recentActivities: RecentActivity[] = [
      ...recentTestCases.map((tc) => ({
        id: tc.id,
        type: 'test_case_created' as const,
        title: tc.title,
        created_at: tc.created_at.toISOString(),
      })),
      ...recentSuites.map((s) => ({
        id: s.id,
        type: 'test_suite_created' as const,
        title: s.title,
        created_at: s.created_at.toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    return {
      success: true,
      data: {
        project: projectInfo,
        testCases: testCaseStats,
        testSuites: testSuitesResult,
        recentActivities,
      },
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'getDashboardStats' } });
    return {
      success: false,
      errors: { _dashboard: ['대시보드 데이터를 불러오는 중 오류가 발생했습니다.'] },
    };
  }
};
