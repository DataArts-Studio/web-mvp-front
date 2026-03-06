import type { Metadata } from 'next';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import TestSuiteDetailView from '@/view/project/suites/test-suite-detail-view';
import { testSuiteByIdQueryOptions } from '@/entities/test-suite/api/query';

export const metadata: Metadata = {
  title: '테스트 스위트 상세',
  description: '테스트 스위트의 상세 정보와 포함된 테스트 케이스를 확인합니다.',
};

export default async function SuiteDetailPage({
  params,
}: {
  params: Promise<{ slug: string; suiteId: string }>;
}) {
  const { suiteId } = await params;
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 60 * 1000 } } });

  try {
    await queryClient.prefetchQuery(testSuiteByIdQueryOptions(suiteId));
  } catch {
    // prefetch 실패 시 클라이언트에서 재시도
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TestSuiteDetailView />
    </HydrationBoundary>
  );
}
