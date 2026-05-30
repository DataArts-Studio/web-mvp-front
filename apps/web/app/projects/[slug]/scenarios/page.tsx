import type { Metadata } from 'next';

import { projectIdQueryOptions } from '@/entities/project/api/query';
import { scenariosQueryOptions } from '@/entities/test-scenario';
import { cachedGetProjectId } from '@/shared/lib/cache';
import { ScenariosView } from '@/view';
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';

export const metadata: Metadata = {
  title: '시나리오 관리',
  description: '요구사항에서 도출한 테스트 시나리오를 작성하고 관리합니다.',
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
      await queryClient.prefetchQuery(scenariosQueryOptions(projectId));
    }
  } catch {
    // prefetch 실패 시 클라이언트에서 재시도
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ScenariosView />
    </HydrationBoundary>
  );
}
