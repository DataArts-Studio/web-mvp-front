'use client';

import React from 'react';

import { cn } from '@testea/util';

interface RunSummaryBarProps {
  stats: {
    total: number;
    pass: number;
    fail: number;
    blocked: number;
    untested: number;
    progressPercent: number;
  };
}

const Count = ({ label, value, tone }: { label: string; value: number; tone: string }) => (
  <span className="flex items-center gap-1">
    <span className="text-white/50">{label}</span>
    <span className={cn('font-bold', value > 0 ? tone : 'text-white/30')}>{value}</span>
  </span>
);

/** 실행 진행 띠. 배경 막대가 통과·실패·차단 비율을, 글자가 건수와 통과율을 보여 준다. */
export const RunSummaryBar = ({ stats }: RunSummaryBarProps) => {
  const { total, pass, fail, blocked, untested } = stats;
  const executed = total - untested;
  const pct = (n: number) => `${total > 0 ? (n / total) * 100 : 0}%`;
  const passRate = total > 0 ? Math.round((pass / total) * 100) : null;

  return (
    <section
      aria-label="실행 진행"
      className="border-line-2 relative flex flex-wrap items-center gap-x-5 gap-y-1 overflow-hidden rounded-[8px] border px-4 py-3"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex">
        <div className="bg-result-pass/[0.08] transition-[width]" style={{ width: pct(pass) }} />
        <div className="bg-result-fail/[0.09] transition-[width]" style={{ width: pct(fail) }} />
        <div
          className="bg-result-blocked/[0.09] transition-[width]"
          style={{ width: pct(blocked) }}
        />
      </div>

      <p className="relative text-[16px] whitespace-nowrap">
        <span className="font-bold text-white/95">{executed}</span>
        <span className="text-white/50"> / {total} 실행</span>
      </p>
      <p className="relative flex flex-wrap items-center gap-3 text-[13px] whitespace-nowrap">
        <Count label="통과" value={pass} tone="text-result-pass" />
        <Count label="실패" value={fail} tone="text-result-fail" />
        <Count label="차단" value={blocked} tone="text-result-blocked" />
        <Count label="남음" value={untested} tone="text-white/75" />
      </p>
      <div className="flex-1" />
      <p className="relative flex items-center gap-1.5 text-[13px] whitespace-nowrap">
        <span className="text-white/45">통과율</span>
        <span className="font-bold text-white/95">{passRate === null ? '-' : `${passRate}%`}</span>
      </p>
    </section>
  );
};
