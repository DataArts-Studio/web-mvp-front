'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { type TestStatusData } from '@/widgets/project';
import { type FetchedTestRun } from '@/entities/test-run';
import { type DashboardMilestone } from '@/features/dashboard';

const TestStatusChart = dynamic(
  () => import('@/widgets/project/ui/test-status-chart').then(mod => ({ default: mod.TestStatusChart })),
  { ssr: false, loading: () => <div className="bg-bg-2 rounded-[16px] p-6 h-[400px] animate-pulse" /> }
);

const MilestoneGanttChart = dynamic(
  () => import('@/widgets/project/ui/milestone-gantt-chart').then(mod => ({ default: mod.MilestoneGanttChart })),
  { ssr: false, loading: () => <div className="bg-bg-2 rounded-[16px] p-6 h-[300px] animate-pulse" /> }
);

interface RunDetailChartsProps {
  testStatusData: TestStatusData;
  milestones: DashboardMilestone[];
  testRuns: FetchedTestRun[];
  selectedRunId: string;
}

export const RunDetailCharts = ({
  testStatusData,
  milestones,
  testRuns,
  selectedRunId,
}: RunDetailChartsProps) => {
  return (
    <div className="border-line-2 flex flex-col gap-4 border-b px-6 py-4">
      <TestStatusChart data={testStatusData} />
      <MilestoneGanttChart
        milestones={milestones}
        testRuns={testRuns}
        selectedRunId={selectedRunId}
        onRunChangeAction={() => {}}
        hideRunSelector
      />
    </div>
  );
};
