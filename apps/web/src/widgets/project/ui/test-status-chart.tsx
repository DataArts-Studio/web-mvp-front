'use client';

import React, { useState } from 'react';

import { type TestStatusData, buildSegments, buildArcs } from './chart-utils';
import { ChartLegend } from './chart-legend';
import { PieChartSvg } from './pie-chart-svg';

export type { TestStatusData } from './chart-utils';

type TestStatusChartProps = {
  data: TestStatusData;
  criticalFailCount?: number;
};

export const TestStatusChart = ({ data }: TestStatusChartProps) => {
  const total = data.pass + data.fail + data.blocked + data.untested;
  const completed = data.pass + data.fail + data.blocked;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

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

  const segments = buildSegments(data, total);
  const arcs = buildArcs(segments, total);

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
          <PieChartSvg
            arcs={arcs}
            hoveredKey={hoveredKey}
            onHover={setHoveredKey}
          />

          {/* Completion rate text */}
          <div className="-mt-2 flex items-baseline gap-2">
            <span className="text-primary text-[96px] font-bold leading-none opacity-50">
              {completionRate}%
            </span>
            <span className="text-text-3 text-lg">Completed</span>
          </div>
        </div>

        {/* Right section: Legend (30%) */}
        <ChartLegend data={data} total={total} />
      </div>
    </div>
  );
};
