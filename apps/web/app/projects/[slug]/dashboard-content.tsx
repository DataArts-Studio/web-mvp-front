import { projectIdQueryOptions } from '@/entities/project/api/query';
import { testCasesQueryOptions } from '@/features/cases-list/api/query';
import { dashboardQueryOptions } from '@/features/dashboard/api/query';
import { testRunsQueryOptions } from '@/features/runs/api/query';
import {
  cachedGetDashboardStats,
  cachedGetProjectId,
  cachedGetTestCasesList,
  cachedGetTestRuns,
} from '@/shared/lib/cache';
import { ProjectDashboardContent } from '@/view/project/dashboard';
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';

export async function DashboardData({ slug }: { slug: string }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 60 * 1000 } },
  });

  let projectId: string | undefined;

  try {
    const statsData = await queryClient.fetchQuery({
      ...dashboardQueryOptions.stats(slug),
      queryFn: () => cachedGetDashboardStats(slug),
    });
    projectId = statsData?.success ? statsData.data.project.id : undefined;

    if (projectId) {
      await Promise.all([
        queryClient.prefetchQuery({
          ...projectIdQueryOptions(slug),
          queryFn: () => cachedGetProjectId(slug),
        }),
        queryClient.prefetchQuery({
          ...testCasesQueryOptions(projectId),
          queryFn: () => cachedGetTestCasesList({ project_id: projectId! }),
        }),
        queryClient.prefetchQuery({
          ...testRunsQueryOptions(projectId),
          queryFn: () => cachedGetTestRuns(projectId!),
        }),
        queryClient.prefetchQuery(dashboardQueryOptions.storageInfo(projectId)),
      ]);

      // 마일스톤(wave 3)은 서버에서 prefetch하지 않는다. testRuns 결과(bestRun) 의존으로
      // 직렬 wave가 하나 더 붙어 콘텐츠 출현을 지연시켰고, 간트 차트는 ssr:false 클라 전용이라
      // 서버 prefetch 이득도 거의 없다. 클라이언트가 testRuns 캐시에서 기본 run을 골라 직접 조회한다.
    }
  } catch {
    // prefetch 실패 시 클라이언트에서 재시도
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProjectDashboardContent projectId={projectId} />
    </HydrationBoundary>
  );
}
