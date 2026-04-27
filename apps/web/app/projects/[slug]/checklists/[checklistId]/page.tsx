import type { Metadata } from 'next';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { ChecklistDetailView } from '@/view';
import { projectIdQueryOptions } from '@/entities/project/api/query';
import { checklistByIdQueryOptions } from '@/entities/checklist/api/query';
import { cachedGetProjectId } from '@/shared/lib/cache';

export const metadata: Metadata = {
  title: '체크리스트 상세',
  description: '체크리스트 항목을 확인하고 체크합니다.',
};

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; checklistId: string }>;
}) {
  const { slug, checklistId } = await params;
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 60 * 1000 } } });

  try {
    const result = await queryClient.fetchQuery({
      ...projectIdQueryOptions(slug),
      queryFn: () => cachedGetProjectId(slug),
    });
    const projectId = result?.success ? result.data.id : undefined;

    if (projectId) {
      await queryClient.prefetchQuery(checklistByIdQueryOptions(checklistId));
    }
  } catch {
    // prefetch 실패 시 클라이언트에서 재시도
  }

  const projectId = queryClient.getQueryData(projectIdQueryOptions(slug).queryKey);
  const resolvedProjectId = projectId && typeof projectId === 'object' && 'success' in projectId && projectId.success ? projectId.data.id : '';

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ChecklistDetailView checklistId={checklistId} projectId={resolvedProjectId} slug={slug} />
    </HydrationBoundary>
  );
}
