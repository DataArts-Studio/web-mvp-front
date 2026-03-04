import type { Metadata } from 'next';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { ProjectDashboardContent, DashboardHeader } from '@/view/project/dashboard';
import { MainContainer } from '@/shared/lib/primitives';
import { projectIdQueryOptions } from '@/entities/project/api/query';
import { dashboardQueryOptions } from '@/features/dashboard/api/query';
import { testCasesQueryOptions } from '@/features/cases-list/api/query';
import { testRunsQueryOptions } from '@/features/runs/api/query';

export const metadata: Metadata = {
  title: '대시보드',
  description: '프로젝트 대시보드에서 테스트 현황, 케이스, 스위트를 한눈에 확인하세요.',
};

export default async function ProjectDashboardRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
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
    <MainContainer className="mx-auto grid min-h-screen w-full max-w-[1200px] flex-1 grid-cols-6 content-start gap-x-5 gap-y-8 px-10 py-8">
      <DashboardHeader />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ProjectDashboardContent />
      </HydrationBoundary>
    </MainContainer>
  );
}
