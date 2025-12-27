'use server';

import { getDatabase, project, suite, testCase } from '@/shared/lib/db';
import { count, eq, desc, isNull } from 'drizzle-orm';

import type {
  DashboardStats,
  ProjectInfo,
  RecentActivity,
  TestCaseStats,
  TestSuiteSummary,
} from '@/features';

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string[]> };

type GetDashboardStatsParams = {
  projectId: string;
};

export const getDashboardStats = async ({
  projectId,
}: GetDashboardStatsParams): Promise<ActionResult<DashboardStats>> => {
  try {
    const db = getDatabase();

    // 프로젝트 정보 조회
    const [projectRow] = await db
      .select()
      .from(project)
      .where(eq(project.id, projectId))
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
      identifier: projectRow.identifier,
      description: projectRow.description ?? '',
      ownerName: projectRow.owner_name ?? '',
      createdAt: projectRow.created_at,
    };

    // 테스트 케이스 통계 조회 (삭제되지 않은 것만)
    const [testCaseCountResult] = await db
      .select({ count: count() })
      .from(testCase)
      .where(eq(testCase.project_id, projectId));

    const testCaseStats: TestCaseStats = {
      total: testCaseCountResult?.count ?? 0,
    };

    // 테스트 스위트 목록 + 각 스위트별 케이스 수
    const suitesWithCount = await db
      .select({
        id: suite.id,
        name: suite.name,
        description: suite.description,
        caseCount: count(testCase.id),
      })
      .from(suite)
      .leftJoin(testCase, eq(suite.id, testCase.test_suite_id))
      .where(eq(suite.project_id, projectId))
      .groupBy(suite.id, suite.name, suite.description);

    const testSuites: TestSuiteSummary[] = suitesWithCount.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description ?? '',
      caseCount: row.caseCount,
    }));

    // 최근 활동 조회 (테스트 케이스 + 스위트 생성 기록)
    const recentTestCases = await db
      .select({
        id: testCase.id,
        title: testCase.name,
        createdAt: testCase.created_at,
      })
      .from(testCase)
      .where(eq(testCase.project_id, projectId))
      .orderBy(desc(testCase.created_at))
      .limit(5);

    const recentSuites = await db
      .select({
        id: suite.id,
        title: suite.name,
        createdAt: suite.create_at,
      })
      .from(suite)
      .where(eq(suite.project_id, projectId))
      .orderBy(desc(suite.create_at))
      .limit(5);

    // 최근 활동 합치기 및 정렬
    const recentActivities: RecentActivity[] = [
      ...recentTestCases.map((tc) => ({
        id: tc.id,
        type: 'test_case_created' as const,
        title: tc.title,
        createdAt: tc.createdAt,
      })),
      ...recentSuites.map((s) => ({
        id: s.id,
        type: 'test_suite_created' as const,
        title: s.title,
        createdAt: s.createdAt,
      })),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
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
    return {
      success: false,
      errors: { _dashboard: ['대시보드 데이터를 불러오는 중 오류가 발생했습니다.'] },
    };
  }
};
