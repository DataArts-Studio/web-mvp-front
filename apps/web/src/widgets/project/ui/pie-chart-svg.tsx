'use client';

import React from 'react';

import { type ArcSegment, VIEW_SIZE } from './chart-utils';

type PieChartSvgProps = {
  arcs: ArcSegment[];
  hoveredKey: string | null;
  onHover: (key: string | null) => void;
};

export const PieChartSvg = ({ arcs, hoveredKey, onHover }: PieChartSvgProps) => {
  const cx = VIEW_SIZE / 2;
  const cy = VIEW_SIZE / 2;
  const hoveredSeg = arcs.find((a) => a.key === hoveredKey);

  return (
    <div className="relative aspect-square w-full max-w-[420px] self-center">
      <svg
        viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
        className="w-full h-full"
      >
        {arcs.length === 1 ? (
          <circle
            cx={cx}
            cy={cy}
            r={VIEW_SIZE / 2}
            fill={arcs[0].color}
            className="transition-opacity duration-150"
            onMouseEnter={() => onHover(arcs[0].key)}
            onMouseLeave={() => onHover(null)}
          />
        ) : (
          arcs.map((arc) => (
            <path
              key={arc.key}
              d={arc.path}
              fill={arc.color}
              className="transition-opacity duration-150"
              style={{ opacity: hoveredKey && hoveredKey !== arc.key ? 0.4 : 1 }}
              onMouseEnter={() => onHover(arc.key)}
              onMouseLeave={() => onHover(null)}
            />
          ))
        )}
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
  );
};
