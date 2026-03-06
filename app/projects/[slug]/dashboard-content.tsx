import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { ProjectDashboardContent } from '@/view/project/dashboard';
import { projectIdQueryOptions } from '@/entities/project/api/query';
import { dashboardQueryOptions } from '@/features/dashboard/api/query';
import { testCasesQueryOptions } from '@/features/cases-list/api/query';
import { testRunsQueryOptions } from '@/features/runs/api/query';

export async function DashboardData({ slug }: { slug: string }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 60 * 1000 } } });

  let projectId: string | undefined;

  try {
    const statsData = await queryClient.fetchQuery(dashboardQueryOptions.stats(slug));
    projectId = statsData?.success ? statsData.data.project.id : undefined;

    if (projectId) {
      await Promise.all([
        queryClient.prefetchQuery(projectIdQueryOptions(slug)),
        queryClient.prefetchQuery(testCasesQueryOptions(projectId)),
        queryClient.prefetchQuery(testRunsQueryOptions(projectId)),
        queryClient.prefetchQuery(dashboardQueryOptions.storageInfo(projectId)),
      ]);

      // 마일스톤 prefetch: testRuns 결과에서 최적 runId 선택
      const testRunsData = queryClient.getQueryData(testRunsQueryOptions(projectId).queryKey);
      if (testRunsData?.success && testRunsData.data.length > 0) {
        const runs = testRunsData.data;
        const bestRun = runs.find((r: { status: string }) => r.status === 'IN_PROGRESS')
          || runs.find((r: { status: string }) => r.status === 'NOT_STARTED')
          || runs[0];
        if (bestRun) {
          await queryClient.prefetchQuery(dashboardQueryOptions.milestones(projectId, bestRun.id));
        }
      }
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
