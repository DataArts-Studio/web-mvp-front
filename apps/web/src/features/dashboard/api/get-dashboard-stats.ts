'use server';

import * as Sentry from '@sentry/nextjs';
import type { DashboardStats, ProjectInfo, RecentActivity, TestCaseStats, TestSuiteSummary } from '@/features/dashboard';
import { getDatabase, projects, testCases, testSuites } from '@/shared/lib/db';
import { and, count, desc, eq, sql } from 'drizzle-orm';
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

    // 독립 쿼리 4개를 병렬 실행 (N+1 제거: 스위트별 케이스 수를 LEFT JOIN으로 단일 쿼리)
    const [
      testCaseStatsRows,
      suiteWithCountRows,
      recentTestCases,
      recentSuites,
    ] = await Promise.all([
      // 1) 테스트 케이스 통계 (total + unassigned 한번에)
      db
        .select({
          total: count(),
          unassigned: count(sql`CASE WHEN ${testCases.test_suite_id} IS NULL THEN 1 END`),
        })
        .from(testCases)
        .where(
          and(
            eq(testCases.project_id, projectRow.id),
            eq(testCases.lifecycle_status, 'ACTIVE')
          )
        ),

      // 2) 스위트 + 케이스 수 (LEFT JOIN, N+1 → 1 쿼리)
      db
        .select({
          id: testSuites.id,
          name: testSuites.name,
          description: testSuites.description,
          case_count: count(testCases.id),
        })
        .from(testSuites)
        .leftJoin(
          testCases,
          and(
            eq(testCases.test_suite_id, testSuites.id),
            eq(testCases.lifecycle_status, 'ACTIVE')
          )
        )
        .where(eq(testSuites.project_id, projectRow.id))
        .groupBy(testSuites.id, testSuites.name, testSuites.description),

      // 3) 최근 테스트 케이스
      db
        .select({
          id: testCases.id,
          title: testCases.name,
          created_at: testCases.created_at,
        })
        .from(testCases)
        .where(
          and(
            eq(testCases.project_id, projectRow.id),
            eq(testCases.lifecycle_status, 'ACTIVE')
          )
        )
        .orderBy(desc(testCases.created_at))
        .limit(5),

      // 4) 최근 스위트
      db
        .select({
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
      total: testCaseStatsRows[0]?.total ?? 0,
      unassigned: testCaseStatsRows[0]?.unassigned ?? 0,
    };

    const testSuitesResult: TestSuiteSummary[] = suiteWithCountRows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description ?? '',
      case_count: row.case_count,
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
    console.error('[getDashboardStats] Error:', error);
    Sentry.captureException(error, { extra: { action: 'getDashboardStats', slug } });
    return {
      success: false,
      errors: { _dashboard: ['대시보드 데이터를 불러오는 중 오류가 발생했습니다.'] },
    };
  }
};
