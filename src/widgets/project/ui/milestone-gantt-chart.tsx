'use client';

import React, { useMemo, useState } from 'react';
import { useToggleSet } from '@/shared/hooks';
import type { DashboardMilestone } from '@/features/dashboard';
import type { FetchedTestRun } from '@/features/runs';
import {
  LABEL_W,
  FIXED_W,
  VISIBLE_WEEK_COUNT,
  WEEK_MS,
  diffMs,
  getBarStyle,
  computeTimeline,
} from './gantt-utils';
import { GanttRunSelector } from './gantt-run-selector';
import { GanttWeekNav } from './gantt-week-nav';
import { GanttMilestoneRow } from './gantt-milestone-row';

type MilestoneGanttChartProps = {
  milestones: DashboardMilestone[];
  testRuns: FetchedTestRun[];
  selectedRunId: string | null;
  onRunChangeAction: (runId: string | null) => void;
  hideRunSelector?: boolean;
};

export const MilestoneGanttChart = ({
  milestones,
  testRuns,
  selectedRunId,
  onRunChangeAction,
  hideRunSelector = false,
}: MilestoneGanttChartProps) => {
  const collapsedMilestones = useToggleSet();
  const [weekOffset, setWeekOffset] = useState(0);

  // 타임라인 범위 및 주차 계산
  const { weeks, timelineStart } = useMemo(() => computeTimeline(milestones), [milestones]);

  // weekOffset이 범위를 벗어나지 않도록 보정 (파생 계산)
  const effectiveOffset = weekOffset > 0 && weekOffset + VISIBLE_WEEK_COUNT > weeks.length
    ? Math.max(0, weeks.length - VISIBLE_WEEK_COUNT)
    : weekOffset;

  // 보이는 주차 (페이지네이션)
  const visibleWeeks = weeks.slice(effectiveOffset, effectiveOffset + VISIBLE_WEEK_COUNT);

  // 보이는 타임라인 범위
  const visibleTimelineStart = visibleWeeks.length > 0 ? visibleWeeks[0].start : timelineStart;
  const visibleTimelineEnd =
    visibleWeeks.length > 0
      ? new Date(visibleWeeks[visibleWeeks.length - 1].start.getTime() + WEEK_MS)
      : new Date(timelineStart.getTime() + VISIBLE_WEEK_COUNT * WEEK_MS);
  const visibleTotalMs = diffMs(visibleTimelineEnd, visibleTimelineStart);

  // 오늘 위치 (visible 차트 영역 내 비율)
  const todayRatio = diffMs(new Date(), visibleTimelineStart) / visibleTotalMs;
  const showTodayLine = todayRatio >= 0 && todayRatio <= 1;

  if (milestones.length === 0 && testRuns.length === 0) {
    return null;
  }

  return (
    <div className="bg-bg-2 relative overflow-hidden rounded-[16px] p-6">
      {/* Green glow */}
      <div className="bg-primary/10 pointer-events-none absolute bottom-0 left-1/4 h-32 w-1/2 rounded-full blur-[80px]" />

      <div className="relative">
        {/* Test run dropdown */}
        {!hideRunSelector && testRuns.length > 0 && (
          <GanttRunSelector
            testRuns={testRuns}
            selectedRunId={selectedRunId}
            onRunChangeAction={onRunChangeAction}
          />
        )}

        {/* Chart area */}
        <div className="relative">
          {/* Today line (visible 범위 안에 있을 때만) */}
          {showTodayLine && (
            <div
              className="pointer-events-none absolute z-20 flex flex-col items-center"
              style={{
                left: `calc(${LABEL_W}px + (100% - ${FIXED_W}px) * ${todayRatio})`,
                top: 0,
                height: '100%',
                transform: 'translateX(-50%)',
              }}
            >
              {/* ▼ 마커 */}
              <span className="text-text-1 text-[10px] leading-none">▼</span>
              {/* 수직선 */}
              <div className="bg-text-4/60 w-px flex-1" />
            </div>
          )}

          {/* Week headers */}
          <GanttWeekNav
            visibleWeeks={visibleWeeks}
            totalWeekCount={weeks.length}
            effectiveOffset={effectiveOffset}
            onOffsetChange={setWeekOffset}
          />

          {/* Milestone rows */}
          <div className="flex flex-col gap-2">
            {milestones.map((m) => (
              <GanttMilestoneRow
                key={m.id}
                milestone={m}
                barStyle={getBarStyle(m.startDate, m.endDate, visibleTimelineStart, visibleTotalMs)}
                isCollapsed={collapsedMilestones.has(m.id)}
                onToggle={() => collapsedMilestones.toggle(m.id)}
                visibleWeeks={visibleWeeks}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
