import type { Metadata } from 'next';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { TestCasesView } from '@/view';
import { dashboardQueryOptions } from '@/features/dashboard/api/query';
import { projectIdQueryOptions } from '@/entities/project/api/query';
import { testCasesQueryOptions } from '@/features/cases-list/api/query';
import { testSuitesQueryOptions } from '@/entities/test-suite/api/query';

export const metadata: Metadata = {
  title: '테스트 케이스',
  description: '프로젝트의 테스트 케이스를 조회하고 관리합니다.',
};

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 60 * 1000 } } });

  try {
    const [statsData] = await Promise.all([
      queryClient.fetchQuery(dashboardQueryOptions.stats(slug)),
      queryClient.prefetchQuery(projectIdQueryOptions(slug)),
    ]);
    const projectId = statsData?.success ? statsData.data.project.id : undefined;

    if (projectId) {
      await Promise.all([
        queryClient.prefetchQuery(testCasesQueryOptions(projectId)),
        queryClient.prefetchQuery(testSuitesQueryOptions(projectId)),
      ]);
    }
  } catch {
    // prefetch 실패 시 클라이언트에서 재시도
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TestCasesView />
    </HydrationBoundary>
  );
}