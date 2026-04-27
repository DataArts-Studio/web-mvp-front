import React from 'react';
import type { DashboardMilestone } from '@/features/dashboard';
import { GanttBar } from './gantt-bar';
import type { WeekInfo } from './gantt-utils';

type GanttMilestoneRowProps = {
  milestone: DashboardMilestone;
  barStyle: { left: string; width: string } | null;
  isCollapsed: boolean;
  onToggle: () => void;
  visibleWeeks: WeekInfo[];
};

export const GanttMilestoneRow = ({
  milestone: m,
  barStyle,
  isCollapsed,
  onToggle,
  visibleWeeks,
}: GanttMilestoneRowProps) => {
  const hasSuites = m.suites.length > 0;

  return (
    <div>
      {/* Parent milestone row */}
      <div>
        <GanttBar
          label={m.name}
          barStyle={barStyle}
          progressPct={m.stats.progressPercent}
          isChild={false}
          visibleWeeks={visibleWeeks}
          collapseProps={{
            hasSuites,
            isCollapsed,
            onToggle,
          }}
        />
      </div>

      {/* Child suite rows */}
      {hasSuites && !isCollapsed && (
        <div className="mt-1 flex flex-col gap-1">
          {m.suites.map((suite) => (
            <div key={suite.id}>
              <GanttBar
                label={suite.name}
                barStyle={barStyle}
                progressPct={suite.stats.progressPercent}
                isChild={true}
                visibleWeeks={visibleWeeks}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
