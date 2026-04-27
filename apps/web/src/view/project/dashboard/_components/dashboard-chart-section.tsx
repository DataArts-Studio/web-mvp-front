import React from 'react';

import Link from 'next/link';
import dynamic from 'next/dynamic';

import type { DashboardMilestone } from '@/features/dashboard';
import type { FetchedTestRun } from '@/features/runs';
import { DSButton } from '@/shared/ui/ds-button';
import { TestStatusChart, type TestStatusData } from '@/widgets/project/ui/test-status-chart';
import { Play } from 'lucide-react';
import { TestRunDropdown } from '../test-run-dropdown';
import { DashboardEmptyState } from '../dashboard-empty-state';
import { ChartSkeleton } from '../dashboard-skeletons';

const MilestoneGanttChart = dynamic(
  () => import('@/widgets/project/ui/milestone-gantt-chart').then(mod => ({ default: mod.MilestoneGanttChart })),
  { ssr: false, loading: () => <div className="bg-bg-2 rounded-2xl p-6 h-75 animate-pulse" /> }
);

type DashboardChartSectionProps = {
  slug: string;
  showSkeleton: boolean;
  testRuns: FetchedTestRun[];
  testStatusData: TestStatusData;
  effectiveSelectedRunId: string | null;
  selectedRunName?: string;
  onSelectRun: (id: string | null) => void;
  ganttRef: React.RefObject<HTMLDivElement | null>;
  ganttVisible: boolean;
  dashboardMilestones: DashboardMilestone[];
  effectiveMilestoneRunId: string | null;
  onMilestoneRunChange: (id: string | null) => void;
};

export const DashboardChartSection = ({
  slug,
  showSkeleton,
  testRuns,
  testStatusData,
  effectiveSelectedRunId,
  selectedRunName,
  onSelectRun,
  ganttRef,
  ganttVisible,
  dashboardMilestones,
  effectiveMilestoneRunId,
  onMilestoneRunChange,
}: DashboardChartSectionProps) => (
  <section className="col-span-6 flex flex-col gap-4" data-tour="test-status-chart">
    <div className="flex items-center justify-between">
      <h2 className="typo-h2-heading text-text-1">테스트 현황</h2>
      <TestRunDropdown
        testRuns={testRuns}
        selectedRunId={effectiveSelectedRunId}
        onSelect={onSelectRun}
        slug={slug}
        selectedRunName={selectedRunName}
      />
    </div>
    {showSkeleton ? <ChartSkeleton /> : testRuns.length === 0 ? (
      <DashboardEmptyState
        icon={<Play className="h-6 w-6" strokeWidth={1.5} />}
        title="첫 번째 테스트를 실행해보세요!"
        description="테스트를 실행하면 결과 차트와 마일스톤 진행 현황을 확인할 수 있어요."
        buttonLabel="테스트 실행 하기"
        onAction={() => {}}
        actionOverride={
          <Link href={`/projects/${slug}/runs/create`}>
            <DSButton variant="solid" className="flex items-center gap-2">
              <span>테스트 실행 하기</span>
            </DSButton>
          </Link>
        }
      />
    ) : (
      <>
        <TestStatusChart data={testStatusData} />
        <div ref={ganttRef}>
          {ganttVisible ? (
            <MilestoneGanttChart
              milestones={dashboardMilestones}
              testRuns={testRuns}
              selectedRunId={effectiveMilestoneRunId}
              onRunChangeAction={onMilestoneRunChange}
            />
          ) : (
            <div className="bg-bg-2 rounded-2xl p-6 h-75 animate-pulse" />
          )}
        </div>
      </>
    )}
  </section>
);
