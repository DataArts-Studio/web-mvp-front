'use server';

import * as Sentry from '@sentry/nextjs';
import type { DashboardStats, ProjectInfo, RecentActivity, TestCaseStats, TestSuiteSummary } from '@/features';
import { getDatabase, projects, suiteTestCases, testCases, testSuites } from '@/shared/lib/db';
import { and, count, desc, eq, isNull, notInArray } from 'drizzle-orm';
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

    // 테스트 케이스 통계 - projectRow.id 사용
    const [testCaseCountResult] = await db
      .select({ count: count() })
      .from(testCases)
      .where(eq(testCases.project_id, projectRow.id));

    // 스위트 미지정 케이스 수
    const assignedTestCasesSubquery = db
        .select({ id: suiteTestCases.test_case_id })
        .from(suiteTestCases);

    const [unassignedCountResult] = await db
        .select({ count: count() })
        .from(testCases)
        .where(
            and(
                eq(testCases.project_id, projectRow.id),
                notInArray(testCases.id, assignedTestCasesSubquery)
            )
        );

    const testCaseStats: TestCaseStats = {
      total: testCaseCountResult?.count ?? 0,
      unassigned: unassignedCountResult?.count ?? 0,
    };

    // 테스트 스위트 목록 - 단순 조회 (케이스 수는 별도 계산)
    const suiteRows = await db
      .select({
        id: testSuites.id,
        name: testSuites.name,
        description: testSuites.description,
      })
      .from(testSuites)
      .where(eq(testSuites.project_id, projectRow.id));

    // 각 스위트별 케이스 수 계산
    const testSuitesResult: TestSuiteSummary[] = await Promise.all(
      suiteRows.map(async (row) => {
        const [caseCountResult] = await db
          .select({ count: count() })
          .from(suiteTestCases)
          .where(eq(suiteTestCases.suite_id, row.id));

        return {
          id: row.id,
          name: row.name,
          description: row.description ?? '',
          case_count: caseCountResult?.count ?? 0,
        };
      })
    );

    // 최근 테스트 케이스 - projectRow.id 사용
    const recentTestCases = await db
      .select({
        id: testCases.id,
        title: testCases.name,
        created_at: testCases.created_at,
      })
      .from(testCases)
      .where(eq(testCases.project_id, projectRow.id))
      .orderBy(desc(testCases.created_at))
      .limit(5);

    // 최근 스위트 - projectRow.id 사용
    const recentSuites = await db
      .select({
        id: testSuites.id,
        title: testSuites.name,
        created_at: testSuites.created_at,
      })
      .from(testSuites)
      .where(eq(testSuites.project_id, projectRow.id))
      .orderBy(desc(testSuites.created_at))
      .limit(5);

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
    console.error('Error fetching dashboard stats:', error);
    Sentry.captureException(error, { extra: { action: 'getDashboardStats' } });
    return {
      success: false,
      errors: { _dashboard: ['대시보드 데이터를 불러오는 중 오류가 발생했습니다.'] },
    };
  }
};
