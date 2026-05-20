import type { Metadata } from 'next';

import { testCaseByIdQueryOptions } from '@/features/cases-list/api/query';
import { TestCaseDetailView } from '@/view';
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';

export const metadata: Metadata = {
  title: '테스트 케이스 상세',
  description: '테스트 케이스의 상세 정보, 테스트 단계, 예상 결과를 확인합니다.',
};

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; caseId: string }>;
}) {
  const { caseId } = await params;
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 60 * 1000 } },
  });

  try {
    await queryClient.prefetchQuery(testCaseByIdQueryOptions(caseId));
  } catch {
    // prefetch 실패 시 클라이언트에서 재시도
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TestCaseDetailView />
    </HydrationBoundary>
  );
}
