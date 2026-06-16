'use client';

import { navItems } from '@/entities/admin-dashboard';
import type { RealDashboardData } from '@/entities/admin-dashboard/api/get-dashboard-data';
import { EmptyState } from '@/shared/ui';
import { BackOfficeLayout } from '@/widgets/back-office-layout';
import {
  AdditionalAnalysisSection,
  CostSpikeSection,
  DashboardHeader,
  MetricsSection,
  TrendAnalysisSection,
} from '@/widgets/dashboard';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * 데이터 원천이 없는 지표는 가짜 예시 대신 "없음"으로 표기한다.
 * - 활성 사용자 DAU/WAU/MAU·가입·어뷰징·Rate Limit: 사용자/이벤트 추적 인프라 부재
 * - 인프라 사용량·시스템 헬스·임계치 알림: Supabase/Sentry/Vercel 외부 지표
 */
function NoDataCard({ title }: { title: string }) {
  return (
    <section className="border-border grid gap-4 rounded-xl border bg-white p-6">
      <h2 className="tracking-zero text-lg font-bold">{title}</h2>
      <EmptyState message="데이터 없음" hint="연동 예정" />
    </section>
  );
}

/** 실시간 지표(DB) 조회 실패 시 표시. */
function DataLoadFailed() {
  return (
    <section className="border-border flex flex-col items-center gap-3 rounded-xl border bg-white px-6 py-16 text-center">
      <AlertTriangle className="h-8 w-8 text-amber-500" aria-hidden="true" />
      <h2 className="text-text-primary text-lg font-bold">실시간 지표를 불러오지 못했습니다</h2>
      <p className="text-text-secondary max-w-md text-sm">
        데이터베이스 응답이 지연되거나 연결할 수 없습니다. 잠시 후 새로고침해 주세요.
      </p>
      <span className="text-text-secondary mt-1 inline-flex items-center gap-1.5 text-xs">
        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
        페이지를 새로고침하면 다시 시도합니다.
      </span>
    </section>
  );
}

export function DashboardPage({ data }: { data: RealDashboardData | null }) {
  return (
    <BackOfficeLayout navItems={navItems} admin={{ name: '관리자', email: 'admin@testea.com' }}>
      <DashboardHeader />
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-5 py-6 lg:px-8">
        {/* 실데이터(DB). 실패 시 실패 UI 로 대체. */}
        {data ? (
          <>
            <MetricsSection metrics={data.metrics} />
            <TrendAnalysisSection
              projectTrend={data.projectTrend}
              activeUserTrend={[]}
              productivityTrend={data.productivityTrend}
              activeProjects={data.activeProjects}
            />
            <CostSpikeSection costProjects={data.costProjects} />
            <AdditionalAnalysisSection
              funnel={data.funnel}
              storageProjects={data.storageProjects}
              storageSummary={data.storageSummary}
            />
          </>
        ) : (
          <DataLoadFailed />
        )}

        {/* 데이터 원천 없음 → 가짜 대신 "없음" */}
        <NoDataCard title="주의 알림" />
        <NoDataCard title="비용 및 시스템 상태" />
        <NoDataCard title="어뷰징 및 이상 행동 모니터링" />
      </div>
    </BackOfficeLayout>
  );
}
