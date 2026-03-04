'use client';

import React, { useState } from 'react';

const STATUS_COLORS = {
  pass: '#0BB57F',
  fail: '#FC4141',
  blocked: '#FBA900',
  untested: '#3B3E44',
} as const;

const STATUS_LABELS = {
  pass: 'Passed',
  fail: 'Failed',
  blocked: 'Blocked',
  untested: 'Not Run',
} as const;

export type TestStatusData = {
  pass: number;
  fail: number;
  blocked: number;
  untested: number;
};

type TestStatusChartProps = {
  data: TestStatusData;
  criticalFailCount?: number;
};

const RADIUS = 90;
const STROKE_WIDTH = 32;
const VIEW_SIZE = (RADIUS + STROKE_WIDTH / 2) * 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP_DEGREES = 2;

export const TestStatusChart = ({ data }: TestStatusChartProps) => {
  const total = data.pass + data.fail + data.blocked + data.untested;
  const completed = data.pass + data.fail + data.blocked;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const segments = (
    ['pass', 'fail', 'blocked', 'untested'] as const
  )
    .map((key) => ({
      key,
      value: data[key],
      color: STATUS_COLORS[key],
      label: STATUS_LABELS[key],
      percentage: total > 0 ? (data[key] / total) * 100 : 0,
    }))
    .filter((s) => s.value > 0);

  const legendItems = [
    { key: 'pass' as const, label: STATUS_LABELS.pass, value: data.pass },
    { key: 'fail' as const, label: STATUS_LABELS.fail, value: data.fail },
    { key: 'blocked' as const, label: STATUS_LABELS.blocked, value: data.blocked },
    { key: 'untested' as const, label: STATUS_LABELS.untested, value: data.untested },
  ];

  // Empty state
  if (total === 0) {
    return (
      <div className="bg-bg-2 relative overflow-hidden rounded-[16px] p-6">
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <div className="relative h-[200px] w-[200px]">
            <div className="border-bg-4 absolute inset-0 rounded-full border-8" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-text-3 text-[64px] font-bold leading-none">
                0%
              </span>
              <span className="typo-body2-normal text-text-3 mt-1">
                Completed
              </span>
            </div>
          </div>
          <p className="typo-body2-normal text-text-3">
            테스트를 실행하면 결과가 여기에 표시됩니다
          </p>
        </div>
      </div>
    );
  }

  // 각 세그먼트의 gap을 고려한 stroke-dasharray/offset 계산
  const totalGapDegrees = segments.length * GAP_DEGREES;
  const availableDegrees = 360 - totalGapDegrees;
  let cumulativeOffset = 0;

  const arcs = segments.map((seg) => {
    const segDegrees = (seg.value / total) * availableDegrees;
    const segLength = (segDegrees / 360) * CIRCUMFERENCE;
    const offset = (cumulativeOffset / 360) * CIRCUMFERENCE;
    const gapOffset = (segments.indexOf(seg) * GAP_DEGREES / 360) * CIRCUMFERENCE;

    cumulativeOffset += segDegrees;

    return {
      ...seg,
      dashArray: `${segLength} ${CIRCUMFERENCE - segLength}`,
      dashOffset: -(offset + gapOffset),
    };
  });

  const hoveredSeg = arcs.find((a) => a.key === hoveredKey);

  return (
    <div className="bg-bg-2 relative overflow-hidden rounded-[16px] p-6">
      {/* Green glow effect at bottom */}
      <div className="bg-primary/10 pointer-events-none absolute bottom-0 left-1/4 h-40 w-1/2 rounded-full blur-[80px]" />

      {/* Total cases badge - top right */}
      <div className="rounded-4 absolute right-6 top-6 bg-[rgba(255,255,255,0.02)] px-4 py-2 backdrop-blur-[20px]">
        <span className="typo-label-heading text-text-2">
          총 {total}개의 케이스
        </span>
      </div>

      <div className="relative flex items-stretch gap-10">
        {/* Left section: Chart + Completion rate (70%) */}
        <div className="flex basis-[70%] flex-col">
          {/* Pie chart */}
          <div className="relative aspect-square w-full max-w-[420px] self-center">
            <svg
              viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
              className="w-full h-full -rotate-90"
            >
              {arcs.map((arc) => (
                <circle
                  key={arc.key}
                  cx={VIEW_SIZE / 2}
                  cy={VIEW_SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke={arc.color}
                  strokeWidth={STROKE_WIDTH}
                  strokeDasharray={arc.dashArray}
                  strokeDashoffset={arc.dashOffset}
                  strokeLinecap="butt"
                  className="transition-opacity duration-150"
                  style={{ opacity: hoveredKey && hoveredKey !== arc.key ? 0.4 : 1 }}
                  onMouseEnter={() => setHoveredKey(arc.key)}
                  onMouseLeave={() => setHoveredKey(null)}
                />
              ))}
            </svg>
            {/* Tooltip */}
            {hoveredSeg && (
              <div className="rounded-2 border-line-2 bg-bg-3 border px-3 py-2 shadow-lg absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                <p className="typo-body2-heading text-text-1">{hoveredSeg.label}</p>
                <p className="typo-caption text-text-2">
                  {hoveredSeg.value}개 ({hoveredSeg.percentage.toFixed(1)}%)
                </p>
              </div>
            )}
          </div>

          {/* Completion rate text */}
          <div className="-mt-2 flex items-baseline gap-2">
            <span className="text-primary text-[96px] font-bold leading-none opacity-50">
              {completionRate}%
            </span>
            <span className="text-text-3 text-lg">Completed</span>
          </div>
        </div>

        {/* Right section: Legend (30%) */}
        <div className="rounded-5 flex basis-[30%] flex-col justify-center gap-5 bg-[rgba(255,255,255,0.02)] p-6 backdrop-blur-[20px]">
          {legendItems.map((item) => {
            const percentage =
              total > 0 ? Math.round((item.value / total) * 100) : 0;
            return (
              <div key={item.key} className="flex items-center gap-4">
                <div
                  className="rounded-4 h-9 w-9 shrink-0"
                  style={{ backgroundColor: STATUS_COLORS[item.key] }}
                />
                <div className="flex flex-col gap-0.5">
                  <span className="typo-body2-heading text-text-1">
                    {String(percentage).padStart(2, '0')}% {item.label}
                  </span>
                  <span className="typo-label-normal text-text-3">
                    <span className="text-primary">
                      {String(item.value).padStart(3, '0')}
                    </span>
                    개의 케이스
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
