import type { Metadata } from 'next';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { TestRunsListView } from '@/view';
import { dashboardQueryOptions } from '@/features/dashboard/api/query';
import { testRunsQueryOptions } from '@/features/runs/api/query';

export const metadata: Metadata = {
  title: '테스트 실행',
  description: '테스트 실행 목록을 조회하고 실행 결과를 관리합니다.',
};

export default async function Page({
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
      await queryClient.prefetchQuery(testRunsQueryOptions(projectId));
    }
  } catch {
    // prefetch 실패 시 클라이언트에서 재시도
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TestRunsListView />
    </HydrationBoundary>
  );
}