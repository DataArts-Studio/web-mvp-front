import React from 'react';

import type { AutomationCoverageResult } from '@/features/automation-candidates';
import { cn } from '@testea/util';

interface CoverageStatProps {
  label: string;
  value: number;
  emphasis?: boolean;
}

const CoverageStat = ({ label, value, emphasis }: CoverageStatProps) => (
  <div className="flex flex-col gap-0.5">
    <span className="typo-label-normal text-text-3">{label}</span>
    <span className={cn('typo-h2-heading', emphasis ? 'text-primary' : 'text-text-1')}>
      {value}
    </span>
  </div>
);

interface CoverageSectionProps {
  coverage: AutomationCoverageResult;
}

/**
 * 자동화 커버리지 요약 + 스위트별 분포.
 *
 * 상단에 전체 케이스 대비 automated 비율(%)을 크게 보여주고,
 * bySuite 가 있으면 스위트별 커버리지 막대를 함께 노출한다.
 */
export const CoverageSection = ({ coverage }: CoverageSectionProps) => {
  const bySuite = [...coverage.bySuite].sort((a, b) => b.coveragePercent - a.coveragePercent);

  return (
    <section className="rounded-4 border-line-2 bg-bg-2 shadow-1 col-span-6 flex flex-col gap-6 border p-6">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h3 className="typo-label-heading text-text-3 tracking-[0.14em] uppercase">
            자동화 커버리지
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-primary text-5xl font-bold">{coverage.coveragePercent}%</span>
            <span className="typo-body2-normal text-text-3">
              전체 {coverage.totalCases}개 중 {coverage.automatedCases}개 자동화 완료
            </span>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <CoverageStat label="자동화 완료" value={coverage.automatedCases} emphasis />
          <CoverageStat label="자동화 대상" value={coverage.candidateCases} />
          <CoverageStat label="수동" value={coverage.manualCases} />
        </div>
      </div>

      {/* 전체 진행 막대 */}
      <div className="bg-bg-3 h-2 w-full overflow-hidden rounded-full">
        <div
          className="bg-primary h-full rounded-full transition-all"
          style={{ width: `${coverage.coveragePercent}%` }}
        />
      </div>

      {/* 스위트별 분포 */}
      {bySuite.length > 0 && (
        <div className="flex flex-col gap-3">
          <h4 className="typo-label-normal text-text-3">스위트별 커버리지</h4>
          <ul className="flex flex-col gap-2.5">
            {bySuite.map((suite) => (
              <li key={suite.suiteId ?? 'no-suite'} className="flex items-center gap-3">
                <span className="typo-body2-normal text-text-2 w-40 shrink-0 truncate">
                  {suite.suiteName ?? '미분류'}
                </span>
                <div className="bg-bg-3 h-1.5 flex-1 overflow-hidden rounded-full">
                  <div
                    className="bg-primary/70 h-full rounded-full"
                    style={{ width: `${suite.coveragePercent}%` }}
                  />
                </div>
                <span className="typo-label-normal text-text-3 w-24 shrink-0 text-right">
                  {suite.automatedCases}/{suite.totalCases} ({suite.coveragePercent}%)
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};
