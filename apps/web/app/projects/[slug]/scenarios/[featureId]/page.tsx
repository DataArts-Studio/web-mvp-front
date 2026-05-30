import type { Metadata } from 'next';

import { projectIdQueryOptions } from '@/entities/project/api/query';
import { scenarioFeaturesQueryOptions, scenariosQueryOptions } from '@/entities/test-scenario';
import { cachedGetProjectId } from '@/shared/lib/cache';
import { ScenarioFeatureDetailView } from '@/view';
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';

export const metadata: Metadata = {
  title: '시나리오 관리',
  description: '기능의 테스트 시나리오를 작성하고 관리합니다.',
};

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; featureId: string }>;
}) {
  const { slug, featureId } = await params;
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
      const filter =
        featureId === 'manual' ? { manual: true } : { requirementAnalysisId: featureId };
      await Promise.all([
        queryClient.prefetchQuery(scenariosQueryOptions(projectId, filter)),
        queryClient.prefetchQuery(scenarioFeaturesQueryOptions(projectId)),
      ]);
    }
  } catch {
    // prefetch 실패 시 클라이언트에서 재시도
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ScenarioFeatureDetailView />
    </HydrationBoundary>
  );
}
