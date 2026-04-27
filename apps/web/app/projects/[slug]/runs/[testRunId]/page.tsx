import type { Metadata } from 'next';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { TestRunDetailView } from '@/view';
import { testRunByIdQueryOptions } from '@/features/runs/api/query';

export const metadata: Metadata = {
  title: '테스트 실행 상세',
  description: '테스트 실행의 상세 결과와 개별 케이스 실행 상태를 확인합니다.',
};

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; testRunId: string }>;
}) {
  const { testRunId } = await params;
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 60 * 1000 } } });

  try {
    await queryClient.prefetchQuery(testRunByIdQueryOptions(testRunId));
  } catch {
    // prefetch 실패 시 클라이언트에서 재시도
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TestRunDetailView />
    </HydrationBoundary>
  );
}
