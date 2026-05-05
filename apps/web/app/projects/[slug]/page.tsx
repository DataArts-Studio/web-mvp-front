import type { Metadata } from 'next';
import { Suspense } from 'react';
import { MainContainer } from '@testea/ui';
import { DashboardHeader } from '@/view/project/dashboard';
import { DashboardData } from './dashboard-content';
import { DashboardContentSkeleton } from './dashboard-content-skeleton';

export const metadata: Metadata = {
  title: '대시보드',
  description: '프로젝트 대시보드에서 테스트 현황, 케이스, 스위트를 한눈에 확인하세요.',
};

export default async function ProjectDashboardRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <MainContainer className="mx-auto grid min-h-screen w-full max-w-[1200px] flex-1 grid-cols-6 content-start gap-x-5 gap-y-8 px-10 py-8">
      <DashboardHeader />
      <Suspense fallback={<DashboardContentSkeleton />}>
        <DashboardData slug={slug} />
      </Suspense>
    </MainContainer>
  );
}
