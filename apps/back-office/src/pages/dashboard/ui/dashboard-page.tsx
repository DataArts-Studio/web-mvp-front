'use client';

import {
  abuseSignals,
  activeUserTrend,
  alerts,
  navItems,
  rateLimitViolation,
  resourceUsages,
  signupMonitoring,
  systemStatuses,
} from '@/entities/admin-dashboard';
import type { RealDashboardData } from '@/entities/admin-dashboard/api/get-dashboard-data';
import { BackOfficeLayout } from '@/widgets/back-office-layout';
import {
  AbuseMonitoringSection,
  AdditionalAnalysisSection,
  AlertsSection,
  CostSpikeSection,
  CostSystemSection,
  DashboardHeader,
  MetricsSection,
  TrendAnalysisSection,
} from '@/widgets/dashboard';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * 일부 지표는 데이터 원천이 없어 예시로 둔다(정직 표기):
 * - 활성 사용자 DAU/WAU/MAU, 가입·동일 IP, Rate Limit: 사용자/이벤트 추적 인프라 부재
 * - 인프라 사용량·시스템 헬스: Supabase/Sentry/Vercel 외부 지표
 */
function SampleDataNotice() {
  return (
    <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
      활성 사용자·인프라·시스템 헬스·어뷰징 지표는 <strong>예시 데이터</strong>입니다. 이 제품은
      사용자 계정이 없어, 해당 지표는 사용자·이벤트 추적 인프라 도입 후 연동됩니다.
    </p>
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
        <SampleDataNotice />

        {/* 실데이터(DB). 실패 시 실패 UI 로 대체. */}
        {data ? (
          <>
            <MetricsSection metrics={data.metrics} />
            <TrendAnalysisSection
              projectTrend={data.projectTrend}
              activeUserTrend={activeUserTrend}
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

        {/* 예시(연동 예정) */}
        <AlertsSection alerts={alerts} />
        <CostSystemSection resourceUsages={resourceUsages} systemStatuses={systemStatuses} />
        <AbuseMonitoringSection
          abuseSignals={abuseSignals}
          signupMonitoring={signupMonitoring}
          rateLimitViolation={rateLimitViolation}
        />
      </div>
    </BackOfficeLayout>
  );
}
