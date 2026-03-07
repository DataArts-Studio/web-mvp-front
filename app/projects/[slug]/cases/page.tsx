import type { Metadata } from 'next';
import { Suspense } from 'react';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { TestCasesView } from '@/view';
import { projectIdQueryOptions } from '@/entities/project/api/query';
import { testCasesQueryOptions } from '@/features/cases-list/api/query';
import { testSuitesQueryOptions } from '@/entities/test-suite/api/query';
import { CasesSkeleton } from './cases-skeleton';

export const metadata: Metadata = {
  title: '테스트 케이스',
  description: '프로젝트의 테스트 케이스를 조회하고 관리합니다.',
};

async function CasesData({ slug }: { slug: string }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 60 * 1000 } } });

  try {
    const result = await queryClient.fetchQuery(projectIdQueryOptions(slug));
    const projectId = result?.success ? result.data.id : undefined;

    if (projectId) {
      await Promise.all([
        queryClient.prefetchQuery(testCasesQueryOptions(projectId, { page: 1, size: 15, sort: 'custom' })),
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

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <Suspense fallback={<CasesSkeleton />}>
      <CasesData slug={slug} />
    </Suspense>
  );
}