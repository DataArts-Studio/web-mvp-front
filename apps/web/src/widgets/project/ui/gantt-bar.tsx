import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { LABEL_W, RIGHT_W } from './gantt-utils';
import type { WeekInfo } from './gantt-utils';

type GanttBarProps = {
  label: string;
  barStyle: { left: string; width: string } | null;
  progressPct: number;
  isChild: boolean;
  visibleWeeks: WeekInfo[];
  collapseProps?: {
    hasSuites: boolean;
    isCollapsed: boolean;
    onToggle: () => void;
  };
};

export const GanttBar = ({
  label,
  barStyle,
  progressPct,
  isChild,
  visibleWeeks,
  collapseProps,
}: GanttBarProps) => (
  <div className="flex items-center">
    {/* Label */}
    <div style={{ width: LABEL_W }} className="shrink-0 pr-2 flex items-center">
      <span
        className={`block truncate flex-1 min-w-0 ${
          isChild ? 'typo-caption text-text-3 pl-4' : 'typo-label-normal text-text-1'
        }`}
      >
        {isChild ? `ㄴ ${label}` : label}
      </span>
      {collapseProps?.hasSuites && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            collapseProps.onToggle();
          }}
          className="shrink-0 p-0.5 rounded-1 hover:bg-bg-3 text-text-3 cursor-pointer"
        >
          {collapseProps.isCollapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
      )}
    </div>

    {/* Bar area */}
    <div className="relative flex-1 overflow-hidden" style={{ height: isChild ? '28px' : '32px' }}>
      {/* Grid lines */}
      <div className="absolute inset-0 flex">
        {visibleWeeks.map((_, i) => (
          <div key={i} className="border-line-2/30 flex-1 border-r last:border-r-0" />
        ))}
      </div>

      {/* Bar */}
      {barStyle ? (
        <div
          className="absolute rounded-full"
          style={{
            left: barStyle.left,
            width: barStyle.width,
            top: '4px',
            height: isChild ? '20px' : '24px',
          }}
        >
          <div className="bg-bg-4 absolute inset-0 rounded-full" />
          <div
            className="bg-primary absolute inset-y-0 left-0 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center pl-2">
          <span className="typo-caption text-text-4">날짜 미설정</span>
        </div>
      )}
    </div>

    {/* Completed text */}
    <div style={{ width: RIGHT_W }} className="shrink-0 pl-4">
      <span className="text-primary typo-label-normal">
        {String(progressPct).padStart(2, '0')}%
      </span>
      <span className="text-text-2 typo-label-normal"> Completed</span>
    </div>
  </div>
);
