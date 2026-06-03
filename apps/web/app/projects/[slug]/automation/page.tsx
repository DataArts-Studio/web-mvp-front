import type { Metadata } from 'next';

import { projectIdQueryOptions } from '@/entities/project/api/query';
import {
  automationCandidatesKeys,
  getAutomationCandidates,
  getAutomationCoverage,
} from '@/features/automation-candidates';
import { AutomationView } from '@/view';
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';

export const metadata: Metadata = {
  title: '자동화 후보',
  description: '자동화 효과가 큰 테스트 케이스를 추천하고 자동화 커버리지를 추적합니다.',
};

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 60 * 1000 } },
  });

  try {
    const result = await queryClient.fetchQuery(projectIdQueryOptions(slug));
    const projectId = result?.success ? result.data.id : undefined;

    if (projectId) {
      await Promise.all([
        queryClient.prefetchQuery({
          queryKey: automationCandidatesKeys.candidates(projectId),
          queryFn: () => getAutomationCandidates(projectId),
        }),
        queryClient.prefetchQuery({
          queryKey: automationCandidatesKeys.coverage(projectId),
          queryFn: () => getAutomationCoverage(projectId),
        }),
      ]);
    }
  } catch {
    // prefetch 실패(예: automation_status 컬럼 미적용) 시 클라이언트에서 재시도하고
    // 조회 실패 분기에서 방어적으로 렌더한다.
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AutomationView />
    </HydrationBoundary>
  );
}
