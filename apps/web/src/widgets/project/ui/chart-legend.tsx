'use client';

import React from 'react';

import { STATUS_COLORS, STATUS_LABELS, STATUS_KEYS, type TestStatusData } from './chart-utils';

type ChartLegendProps = {
  data: TestStatusData;
  total: number;
};

export const ChartLegend = ({ data, total }: ChartLegendProps) => {
  const legendItems = STATUS_KEYS.map((key) => ({
    key,
    label: STATUS_LABELS[key],
    value: data[key],
  }));

  return (
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
  );
};
