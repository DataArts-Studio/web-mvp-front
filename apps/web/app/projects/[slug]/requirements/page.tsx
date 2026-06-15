import type { Metadata } from 'next';

import { projectIdQueryOptions } from '@/entities/project/api/query';
import { requirementAnalysesQueryOptions } from '@/entities/requirement-analysis';
import { cachedGetProjectId } from '@/shared/lib/cache';
import { RequirementsView } from '@/view';
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';

export const metadata: Metadata = {
  title: '요구사항 생성',
  description: 'AI로 요구사항 분석서와 테스트 시나리오를 생성하고 목록을 관리합니다.',
};

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 60 * 1000 } },
  });

  try {
    const result = await queryClient.fetchQuery({
      ...projectIdQueryOptions(slug),
      queryFn: () => cachedGetProjectId(slug),
    });
    const projectId = result?.success ? result.data.id : undefined;

    if (projectId) {
      await queryClient.prefetchQuery(requirementAnalysesQueryOptions(projectId));
    }
  } catch {
    // prefetch 실패 시 클라이언트에서 재시도
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RequirementsView />
    </HydrationBoundary>
  );
}
