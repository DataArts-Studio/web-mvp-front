import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { ProjectDashboardContent } from '@/view/project/dashboard';
import { projectIdQueryOptions } from '@/entities/project/api/query';
import { dashboardQueryOptions } from '@/features/dashboard/api/query';
import { testCasesQueryOptions } from '@/features/cases-list/api/query';
import { testRunsQueryOptions } from '@/features/runs/api/query';

export async function DashboardData({ slug }: { slug: string }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 60 * 1000 } } });

  try {
    const statsData = await queryClient.fetchQuery(dashboardQueryOptions.stats(slug));
    const projectId = statsData?.success ? statsData.data.project.id : undefined;

    if (projectId) {
      await Promise.all([
        queryClient.prefetchQuery(projectIdQueryOptions(slug)),
        queryClient.prefetchQuery(testCasesQueryOptions(projectId)),
        queryClient.prefetchQuery(testRunsQueryOptions(projectId)),
        queryClient.prefetchQuery(dashboardQueryOptions.storageInfo(projectId)),
      ]);
    }
  } catch {
    // prefetch 실패 시 클라이언트에서 재시도
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProjectDashboardContent />
    </HydrationBoundary>
  );
}
