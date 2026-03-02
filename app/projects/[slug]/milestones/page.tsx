import type { Metadata } from 'next';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { MilestonesView } from '@/view';
import { dashboardQueryOptions } from '@/features/dashboard/api/query';
import { milestonesQueryOptions } from '@/entities/milestone/api/query';

export const metadata: Metadata = {
  title: '마일스톤',
  description: '프로젝트 마일스톤을 관리하고 테스트 진행률을 추적합니다.',
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
      await queryClient.prefetchQuery(milestonesQueryOptions(projectId));
    }
  } catch {
    // prefetch 실패 시 클라이언트에서 재시도
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MilestonesView />
    </HydrationBoundary>
  );
}