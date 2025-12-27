'use server';

import type {
  DashboardStats,
  ProjectInfo,
  RecentActivity,
  TestCaseStats,
  TestSuiteSummary,
} from '@/features';

import { getDatabase, projects, suite, testCases } from '@/shared/lib/db';
import { and, count, desc, eq, isNull } from 'drizzle-orm';

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string[]> };

type GetDashboardStatsParams = {
  projectName: string;
};

export const getDashboardStats = async ({
  projectName,
}: GetDashboardStatsParams): Promise<ActionResult<DashboardStats>> => {
  try {
    const db = getDatabase();
    console.log('[Dashboard] projectName:', projectName);

    // 프로젝트 정보 조회 (name으로 검색)
    const [projectRow] = await db
      .select()
      .from(projects)
      .where(eq(projects.name, projectName))
      .limit(1);

    console.log('[Dashboard] projectRow:', projectRow);

    if (!projectRow) {
      return {
        success: false,
        errors: { _project: ['프로젝트를 찾을 수 없습니다.'] },
      };
    }

    const projectInfo: ProjectInfo = {
      id: projectRow.id,
      name: projectRow.name,
      identifier: projectRow.identifier,
      description: projectRow.description ?? '',
      ownerName: projectRow.owner_name ?? '',
      created_at: projectRow.created_at,
    };

    // 테스트 케이스 통계 - projectRow.id 사용
    const [testCaseCountResult] = await db
      .select({ count: count() })
      .from(testCases)
      .where(eq(testCases.project_id, projectRow.id));

    console.log('[Dashboard] testCaseCountResult:', testCaseCountResult);

    // 스위트 미지정 케이스 수
    const [unassignedCountResult] = await db
      .select({ count: count() })
      .from(testCases)
      .where(and(eq(testCases.project_id, projectRow.id), isNull(testCases.test_suite_id)));

    console.log('[Dashboard] unassignedCountResult:', unassignedCountResult);

    const testCaseStats: TestCaseStats = {
      total: testCaseCountResult?.count ?? 0,
      unassigned: unassignedCountResult?.count ?? 0,
    };

    // 테스트 스위트 목록 - 단순 조회 (케이스 수는 별도 계산)
    const suiteRows = await db
      .select({
        id: suite.id,
        name: suite.name,
        description: suite.description,
      })
      .from(suite)
      .where(eq(suite.project_id, projectRow.id));

    console.log('[Dashboard] suiteRows:', suiteRows);

    // 각 스위트별 케이스 수 계산
    const testSuites: TestSuiteSummary[] = await Promise.all(
      suiteRows.map(async (row) => {
        const [caseCountResult] = await db
          .select({ count: count() })
          .from(testCases)
          .where(eq(testCases.test_suite_id, row.id));

        return {
          id: row.id,
          name: row.name,
          description: row.description ?? '',
          case_count: caseCountResult?.count ?? 0,
        };
      })
    );

    console.log('[Dashboard] testSuites:', testSuites);

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

    console.log('[Dashboard] recentTestCases:', recentTestCases);

    // 최근 스위트 - projectRow.id 사용
    const recentSuites = await db
      .select({
        id: suite.id,
        title: suite.name,
        created_at: suite.created_at,
      })
      .from(suite)
      .where(eq(suite.project_id, projectRow.id))
      .orderBy(desc(suite.created_at))
      .limit(5);

    console.log('[Dashboard] recentSuites:', recentSuites);

    // 최근 활동 합치기 및 정렬
    const recentActivities: RecentActivity[] = [
      ...recentTestCases.map((tc) => ({
        id: tc.id,
        type: 'test_case_created' as const,
        title: tc.title,
        created_at: tc.created_at,
      })),
      ...recentSuites.map((s) => ({
        id: s.id,
        type: 'test_suite_created' as const,
        title: s.title,
        created_at: s.created_at,
      })),
    ]
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, 5);

    return {
      success: true,
      data: {
        project: projectInfo,
        testCases: testCaseStats,
        testSuites,
        recentActivities,
      },
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      errors: { _dashboard: [`대시보드 데이터를 불러오는 중 오류가 발생했습니다: ${errorMessage}`] },
    };
  }
};
