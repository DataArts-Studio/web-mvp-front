import type { Metadata } from 'next';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { MilestoneDetailView } from '@/view';
import { milestoneByIdQueryOptions } from '@/features/milestones/api/query';

export const metadata: Metadata = {
  title: '마일스톤 상세',
  description: '마일스톤의 진행률, 포함된 테스트 케이스, 실행 이력을 확인합니다.',
};

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; milestoneId: string }>;
}) {
  const { milestoneId } = await params;
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 60 * 1000 } } });

  try {
    await queryClient.prefetchQuery(milestoneByIdQueryOptions(milestoneId));
  } catch {
    // prefetch 실패 시 클라이언트에서 재시도
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MilestoneDetailView />
    </HydrationBoundary>
  );
}
