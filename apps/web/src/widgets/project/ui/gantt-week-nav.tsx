import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { LABEL_W, RIGHT_W, VISIBLE_WEEK_COUNT } from './gantt-utils';
import type { WeekInfo } from './gantt-utils';

type GanttWeekNavProps = {
  visibleWeeks: WeekInfo[];
  totalWeekCount: number;
  effectiveOffset: number;
  onOffsetChange: (offset: number) => void;
};

export const GanttWeekNav = ({
  visibleWeeks,
  totalWeekCount,
  effectiveOffset,
  onOffsetChange,
}: GanttWeekNavProps) => {
  const canGoPrev = effectiveOffset > 0;
  const canGoNext = effectiveOffset + VISIBLE_WEEK_COUNT < totalWeekCount;
  const hasPagination = totalWeekCount > VISIBLE_WEEK_COUNT;

  return (
    <div className="border-line-2 mb-4 flex items-center border-b pb-2">
      <div style={{ width: LABEL_W }} className="shrink-0" />
      <div className="relative flex flex-1">
        {visibleWeeks.map((week, i) => (
          <div
            key={i}
            className="typo-caption text-text-3 flex-1 text-center uppercase"
          >
            {week.label}
          </div>
        ))}
      </div>
      <div style={{ width: RIGHT_W }} className="shrink-0 flex items-center justify-end gap-1">
        {hasPagination && (
          <>
            <button
              onClick={() => onOffsetChange(Math.max(0, effectiveOffset - VISIBLE_WEEK_COUNT))}
              disabled={!canGoPrev}
              className={`rounded-full p-1 transition-colors ${
                canGoPrev
                  ? 'hover:bg-bg-3 text-text-3 cursor-pointer'
                  : 'text-text-4/30 cursor-default'
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => onOffsetChange(Math.min(effectiveOffset + VISIBLE_WEEK_COUNT, totalWeekCount - VISIBLE_WEEK_COUNT))}
              disabled={!canGoNext}
              className={`rounded-full p-1 transition-colors ${
                canGoNext
                  ? 'hover:bg-bg-3 text-text-3 cursor-pointer'
                  : 'text-text-4/30 cursor-default'
              }`}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
