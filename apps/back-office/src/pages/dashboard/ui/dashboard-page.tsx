'use client';

import {
  abuseSignals,
  activeProjects,
  activeUserTrend,
  alerts,
  costProjects,
  funnel,
  metrics,
  navItems,
  productivityTrend,
  projectTrend,
  rateLimitViolation,
  resourceUsages,
  signupMonitoring,
  storageProjects,
  storageSummary,
  systemStatuses,
} from '@/entities/admin-dashboard';
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

export function DashboardPage() {
  return (
    <BackOfficeLayout navItems={navItems}>
      <DashboardHeader />
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-5 py-6 lg:px-8">
        <AlertsSection alerts={alerts} />
        <MetricsSection metrics={metrics} />
        <TrendAnalysisSection
          projectTrend={projectTrend}
          activeUserTrend={activeUserTrend}
          productivityTrend={productivityTrend}
          activeProjects={activeProjects}
        />
        <CostSystemSection resourceUsages={resourceUsages} systemStatuses={systemStatuses} />
        <CostSpikeSection costProjects={costProjects} />
        <AbuseMonitoringSection
          abuseSignals={abuseSignals}
          signupMonitoring={signupMonitoring}
          rateLimitViolation={rateLimitViolation}
        />
        <AdditionalAnalysisSection
          funnel={funnel}
          storageProjects={storageProjects}
          storageSummary={storageSummary}
        />
      </div>
    </BackOfficeLayout>
  );
}
