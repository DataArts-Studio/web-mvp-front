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

export function DashboardPage({ data }: { data: RealDashboardData }) {
  return (
    <BackOfficeLayout navItems={navItems} admin={{ name: '관리자', email: 'admin@testea.com' }}>
      <DashboardHeader />
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-5 py-6 lg:px-8">
        <SampleDataNotice />
        {/* 예시: 임계치 알림(연동 예정) */}
        <AlertsSection alerts={alerts} />
        {/* 실데이터 */}
        <MetricsSection metrics={data.metrics} />
        <TrendAnalysisSection
          projectTrend={data.projectTrend}
          activeUserTrend={activeUserTrend}
          productivityTrend={data.productivityTrend}
          activeProjects={data.activeProjects}
        />
        {/* 예시: 인프라·헬스(외부 지표) */}
        <CostSystemSection resourceUsages={resourceUsages} systemStatuses={systemStatuses} />
        {/* 실데이터 */}
        <CostSpikeSection costProjects={data.costProjects} />
        {/* 예시: 어뷰징·가입(추적 인프라 부재) */}
        <AbuseMonitoringSection
          abuseSignals={abuseSignals}
          signupMonitoring={signupMonitoring}
          rateLimitViolation={rateLimitViolation}
        />
        {/* 실데이터 */}
        <AdditionalAnalysisSection
          funnel={data.funnel}
          storageProjects={data.storageProjects}
          storageSummary={data.storageSummary}
        />
      </div>
    </BackOfficeLayout>
  );
}
