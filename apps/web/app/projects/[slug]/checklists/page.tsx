import type { Metadata } from 'next';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { ChecklistsView } from '@/view';
import { projectIdQueryOptions } from '@/entities/project/api/query';
import { checklistsQueryOptions } from '@/entities/checklist/api/query';
import { cachedGetProjectId } from '@/shared/lib/cache';

export const metadata: Metadata = {
  title: '체크리스트',
  description: '배포 전 확인 항목을 체크리스트로 관리합니다.',
};

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 60 * 1000 } } });

  try {
    const result = await queryClient.fetchQuery({
      ...projectIdQueryOptions(slug),
      queryFn: () => cachedGetProjectId(slug),
    });
    const projectId = result?.success ? result.data.id : undefined;

    if (projectId) {
      await queryClient.prefetchQuery(checklistsQueryOptions(projectId));
    }
  } catch {
    // prefetch 실패 시 클라이언트에서 재시도
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ChecklistsView />
    </HydrationBoundary>
  );
}
