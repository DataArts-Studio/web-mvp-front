'use client';

import React from 'react';

import type { MilestoneWithStats } from '@/entities/milestone';

import { type ProgressSeries } from './milestone-detail-model';
import { daysBetween, formatMonthDay } from './milestone-list-model';

const W = 1000;
const H = 120;
const PAD_TOP = 8;

const Legend = ({ color, dashed, label }: { color: string; dashed?: boolean; label: string }) => (
  <span className="flex items-center gap-1.5 text-[11px] text-white/50">
    <svg width="16" height="4" aria-hidden="true">
      <line
        x1="0"
        y1="2"
        x2="16"
        y2="2"
        stroke={color}
        strokeWidth="2"
        strokeDasharray={dashed ? '2 2' : undefined}
      />
    </svg>
    {label}
  </span>
);

interface MilestoneProgressChartProps {
  milestone: MilestoneWithStats;
  series: ProgressSeries | null;
}

export const MilestoneProgressChart = ({ milestone, series }: MilestoneProgressChartProps) => {
  const executed = milestone.completedCases;
  const summary = (
    <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span className="text-[20px] font-bold text-white">{milestone.progressRate}%</span>
      <span className="text-[12px] text-white/45">
        {executed} / {milestone.totalCases} 실행
      </span>
      <span className="text-[12px] text-white/45">
        통과 {milestone.passCases} · 실패 {milestone.failCases} · 차단 {milestone.blockedCases}
      </span>
    </p>
  );

  if (!series) {
    return (
      <section
        aria-label="진행"
        className="border-line-2 flex flex-col gap-2 rounded-[8px] border px-5 py-4"
      >
        {summary}
        <p className="text-[12px] text-white/35">
          {milestone.totalCases === 0
            ? '범위에 케이스가 없어 진행 그래프를 그리지 않습니다.'
            : '시작일과 목표일을 정하면 진행 그래프가 나옵니다.'}
        </p>
      </section>
    );
  }

  // 목표일과 해가 다른 날짜(예: 지금 속도로 내년에 끝남)는 연도까지 보여 준다.
  const dayLabel = (date: string) =>
    date.slice(0, 4) === series.end.slice(0, 4) ? formatMonthDay(date) : date.replaceAll('-', '.');
  const span = Math.max(1, daysBetween(series.start, series.end));
  const x = (date: string) =>
    (Math.min(span, Math.max(0, daysBetween(series.start, date))) / span) * W;
  const y = (count: number) => PAD_TOP + (1 - count / series.total) * (H - PAD_TOP);
  const line = (key: 'executed' | 'passed') =>
    series.points.map((p) => `${x(p.date).toFixed(1)},${y(p[key]).toFixed(1)}`).join(' ');
  const last = series.points.at(-1);
  const area = last
    ? `${x(series.start)},${H} ${line('executed')} ${x(last.date).toFixed(1)},${H}`
    : '';

  // 지금 속도로 이어 그린 선. 목표일 너머로 가면 목표일에서 자른다.
  let projection: { x1: number; y1: number; x2: number; y2: number } | null = null;
  if (last && series.today && series.expectedDate) {
    const endX = x(series.expectedDate);
    const total = series.total;
    if (series.expectedDate <= series.end) {
      projection = { x1: x(last.date), y1: y(last.executed), x2: endX, y2: y(total) };
    } else {
      const daysToEnd = daysBetween(last.date, series.end);
      const daysToDone = daysBetween(last.date, series.expectedDate);
      const atEnd = last.executed + ((total - last.executed) * daysToEnd) / daysToDone;
      projection = { x1: x(last.date), y1: y(last.executed), x2: W, y2: y(atEnd) };
    }
  }

  const expectedInRange = series.expectedDate && series.expectedDate <= series.end;
  const ariaLabel = `진행 그래프: ${formatMonthDay(series.start)}부터 ${formatMonthDay(series.end)}까지, ${executed}건 실행, 통과 ${milestone.passCases}건${
    series.expectedDate ? `, 지금 속도면 ${dayLabel(series.expectedDate)} 완료 예상` : ''
  }`;

  return (
    <section
      aria-label="진행"
      className="border-line-2 flex flex-col gap-3 rounded-[8px] border px-5 py-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        {summary}
        <div className="flex flex-wrap items-center gap-3">
          <Legend color="var(--color-result-running)" label="실행 완료" />
          <Legend color="var(--color-result-pass)" label="통과" />
          <Legend color="rgba(255,255,255,0.4)" dashed label="목표 속도" />
          {projection && <Legend color="var(--color-result-running)" dashed label="이 속도면" />}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={ariaLabel}
        className="h-[120px] w-full overflow-visible"
      >
        {[0.5, 1].map((r) => (
          <line
            key={r}
            x1="0"
            x2={W}
            y1={y(series.total * r)}
            y2={y(series.total * r)}
            stroke="rgba(255,255,255,0.06)"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <line
          x1="0"
          y1={y(0)}
          x2={W}
          y2={y(series.total)}
          stroke="rgba(255,255,255,0.35)"
          strokeDasharray="4 4"
          vectorEffect="non-scaling-stroke"
        />
        {area && <polygon points={area} fill="var(--color-result-running)" fillOpacity="0.08" />}
        <polyline
          points={line('executed')}
          fill="none"
          stroke="var(--color-result-running)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        <polyline
          points={line('passed')}
          fill="none"
          stroke="var(--color-result-pass)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        {projection && (
          <line
            {...projection}
            stroke="var(--color-result-running)"
            strokeDasharray="2 3"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        )}
        {series.today && (
          <line
            x1={x(series.today)}
            x2={x(series.today)}
            y1="0"
            y2={H}
            stroke="rgba(255,255,255,0.35)"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>

      <div className="relative h-4 font-mono text-[10px] text-white/40">
        <span className="absolute left-0">{formatMonthDay(series.start)}</span>
        {series.today && (
          <span
            className="absolute -translate-x-1/2 text-white/80"
            style={{ left: `${(x(series.today) / W) * 100}%` }}
          >
            오늘 {formatMonthDay(series.today)}
          </span>
        )}
        {expectedInRange && series.expectedDate !== series.today && (
          <span
            className="text-result-running absolute -translate-x-1/2"
            style={{ left: `${(x(series.expectedDate!) / W) * 100}%` }}
          >
            {dayLabel(series.expectedDate!)} 완료 예상
          </span>
        )}
        <span className="absolute right-0">{formatMonthDay(series.end)} 목표</span>
      </div>
      {series.expectedDate && !expectedInRange && (
        <p className="text-result-blocked text-[11px]">
          지금 속도면 {dayLabel(series.expectedDate)}에 끝나 목표일을 넘깁니다.
        </p>
      )}
    </section>
  );
};
