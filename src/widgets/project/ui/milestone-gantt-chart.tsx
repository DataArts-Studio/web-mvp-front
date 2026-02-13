'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useOutsideClick, useToggleSet } from '@/shared/hooks';
import type { DashboardMilestone } from '@/features/dashboard';
import type { FetchedTestRun } from '@/features/runs';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

type MilestoneGanttChartProps = {
  milestones: DashboardMilestone[];
  testRuns: FetchedTestRun[];
  selectedRunId: string | null;
  onRunChange: (runId: string | null) => void;
  hideRunSelector?: boolean;
};

const LABEL_W = 180;
const RIGHT_W = 140;
const FIXED_W = LABEL_W + RIGHT_W;
const VISIBLE_WEEK_COUNT = 6;

/** 주어진 날짜가 속한 주의 월요일을 반환 */
const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const diffMs = (a: Date, b: Date) => a.getTime() - b.getTime();
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const MilestoneGanttChart = ({
  milestones,
  testRuns,
  selectedRunId,
  onRunChange,
  hideRunSelector = false,
}: MilestoneGanttChartProps) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const collapsedMilestones = useToggleSet();
  const [weekOffset, setWeekOffset] = useState(0);

  useOutsideClick(dropdownRef, () => setShowDropdown(false));

  const selectedRun = testRuns.find((r) => r.id === selectedRunId);

  // 타임라인 범위 및 주차 계산
  const { weeks, timelineStart } = useMemo(() => {
    const now = new Date();
    let minDate = now;
    let maxDate = now;

    for (const m of milestones) {
      if (m.startDate) {
        const d = new Date(m.startDate);
        if (d < minDate) minDate = d;
      }
      if (m.endDate) {
        const d = new Date(m.endDate);
        if (d > maxDate) maxDate = d;
      }
    }

    const start = getWeekStart(new Date(minDate.getTime() - WEEK_MS));
    const rawEnd = new Date(maxDate.getTime() + WEEK_MS);
    const endWeekStart = getWeekStart(rawEnd);
    const end = new Date(endWeekStart.getTime() + WEEK_MS);

    const minWeeks = 6;
    const currentWeeks = Math.ceil(diffMs(end, start) / WEEK_MS);
    const finalEnd =
      currentWeeks < minWeeks
        ? new Date(start.getTime() + minWeeks * WEEK_MS)
        : end;

    const totalMs = diffMs(finalEnd, start);
    const weekCount = Math.ceil(totalMs / WEEK_MS);

    const weeks: { label: string; start: Date }[] = [];
    for (let i = 0; i < weekCount; i++) {
      const weekStart = new Date(start.getTime() + i * WEEK_MS);
      weeks.push({ label: `WEEK ${i + 1}`, start: weekStart });
    }

    return { weeks, timelineStart: start, timelineEnd: finalEnd, totalMs };
  }, [milestones]);

  // weekOffset이 범위를 벗어나지 않도록 보정
  useEffect(() => {
    if (weekOffset > 0 && weekOffset + VISIBLE_WEEK_COUNT > weeks.length) {
      setWeekOffset(Math.max(0, weeks.length - VISIBLE_WEEK_COUNT));
    }
  }, [weeks.length, weekOffset]);

  // 보이는 주차 (페이지네이션)
  const visibleWeeks = weeks.slice(weekOffset, weekOffset + VISIBLE_WEEK_COUNT);
  const canGoNext = weekOffset + VISIBLE_WEEK_COUNT < weeks.length;
  const canGoPrev = weekOffset > 0;
  const hasPagination = weeks.length > VISIBLE_WEEK_COUNT;

  // 보이는 타임라인 범위
  const visibleTimelineStart = visibleWeeks.length > 0 ? visibleWeeks[0].start : timelineStart;
  const visibleTimelineEnd =
    visibleWeeks.length > 0
      ? new Date(visibleWeeks[visibleWeeks.length - 1].start.getTime() + WEEK_MS)
      : new Date(timelineStart.getTime() + VISIBLE_WEEK_COUNT * WEEK_MS);
  const visibleTotalMs = diffMs(visibleTimelineEnd, visibleTimelineStart);

  // 오늘 위치 (visible 차트 영역 내 비율)
  const todayRatio = useMemo(() => {
    const now = new Date();
    return diffMs(now, visibleTimelineStart) / visibleTotalMs;
  }, [visibleTimelineStart, visibleTotalMs]);

  const showTodayLine = todayRatio >= 0 && todayRatio <= 1;

  if (milestones.length === 0 && testRuns.length === 0) {
    return null;
  }

  const getBarStyle = (startDate: string | null, endDate: string | null) => {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const leftPct = (diffMs(start, visibleTimelineStart) / visibleTotalMs) * 100;
    const widthPct = (diffMs(end, start) / visibleTotalMs) * 100;
    return {
      left: `${leftPct}%`,
      width: `${Math.max(1, widthPct)}%`,
    };
  };

  // Gantt 행 렌더링 함수
  const renderBar = (
    label: string,
    barStyle: { left: string; width: string } | null,
    progressPct: number,
    isChild: boolean,
    collapseProps?: {
      hasSuites: boolean;
      isCollapsed: boolean;
      onToggle: () => void;
    }
  ) => (
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

  return (
    <div className="bg-bg-2 relative overflow-hidden rounded-[16px] p-6">
      {/* Green glow */}
      <div className="bg-primary/10 pointer-events-none absolute bottom-0 left-1/4 h-32 w-1/2 rounded-full blur-[80px]" />

      <div className="relative">
        {/* Test run dropdown */}
        {!hideRunSelector && testRuns.length > 0 && (
          <div className="mb-5 flex items-center" ref={dropdownRef}>
            <div className="relative">
              <button
                onClick={() => setShowDropdown((prev) => !prev)}
                className="border-primary/40 text-text-1 rounded-4 flex items-center gap-2 border bg-transparent px-3 py-1.5 transition-colors hover:border-primary cursor-pointer"
              >
                <span className="typo-label-normal max-w-[200px] truncate">
                  {selectedRun?.name || '테스트 실행 선택'}
                </span>
                <ChevronDown
                  className={`text-text-3 h-4 w-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                />
              </button>
              {showDropdown && (
                <div className="bg-bg-3 border-line-2 rounded-4 shadow-3 absolute left-0 top-full z-20 mt-1 min-w-[240px] border py-1">
                  {testRuns.map((run) => (
                    <button
                      key={run.id}
                      onClick={() => {
                        onRunChange(run.id);
                        setShowDropdown(false);
                      }}
                      className={`flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-bg-4 ${
                        run.id === selectedRunId ? 'bg-bg-4' : ''
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                          run.status === 'IN_PROGRESS'
                            ? 'bg-primary'
                            : run.status === 'COMPLETED'
                              ? 'bg-text-3'
                              : 'bg-text-4'
                        }`}
                      />
                      <span className="typo-label-normal text-text-1 truncate">
                        {run.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
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
                    onClick={() => setWeekOffset((prev) => Math.max(0, prev - VISIBLE_WEEK_COUNT))}
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
                    onClick={() => setWeekOffset((prev) => Math.min(prev + VISIBLE_WEEK_COUNT, weeks.length - VISIBLE_WEEK_COUNT))}
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

          {/* Milestone rows */}
          <div className="flex flex-col gap-2">
            {milestones.map((m) => {
              const barStyle = getBarStyle(m.startDate, m.endDate);
              const isCollapsed = collapsedMilestones.has(m.id);
              const hasSuites = m.suites.length > 0;

              return (
                <div key={m.id}>
                  {/* Parent milestone row */}
                  <div>
                    {renderBar(m.name, barStyle, m.stats.progressPercent, false, {
                      hasSuites,
                      isCollapsed,
                      onToggle: () => collapsedMilestones.toggle(m.id),
                    })}
                  </div>

                  {/* Child suite rows */}
                  {hasSuites && !isCollapsed && (
                    <div className="mt-1 flex flex-col gap-1">
                      {m.suites.map((suite) => (
                        <div key={suite.id}>
                          {renderBar(
                            suite.name,
                            barStyle,
                            suite.stats.progressPercent,
                            true
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
