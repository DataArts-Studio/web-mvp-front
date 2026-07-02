import React from 'react';

import type { AutomationCoverageResult } from '@/features/automation-candidates';

interface CoverageSectionProps {
  coverage: AutomationCoverageResult;
}

export const CoverageSection = ({ coverage }: CoverageSectionProps) => {
  const total = Math.max(coverage.totalCases, 1);
  const automatedPercent = (coverage.automatedCases / total) * 100;
  const candidatePercent = (coverage.candidateCases / total) * 100;
  const manualPercent = Math.max(0, 100 - automatedPercent - candidatePercent);

  return (
    <section className="col-span-6 flex flex-col gap-3">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h3 className="text-text-1 text-base font-semibold">자동화 커버리지</h3>
          <p className="text-text-4 mt-1 text-sm">
            전체 {coverage.totalCases}개 중 {coverage.automatedCases}개 자동화 완료
          </p>
        </div>
        <div className="text-right">
          <div className="text-text-1 text-2xl leading-none font-semibold">
            {coverage.coveragePercent}%
          </div>
          <div className="text-text-4 mt-1 text-xs">완료 기준</div>
        </div>
      </header>

      <div className="space-y-2">
        <div className="bg-bg-3 flex h-3 w-full overflow-hidden">
          <div className="bg-primary" style={{ width: `${automatedPercent}%` }} />
          <div className="bg-amber-400" style={{ width: `${candidatePercent}%` }} />
          <div className="bg-line-3" style={{ width: `${manualPercent}%` }} />
        </div>

        <div className="text-text-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
          <LegendDot className="bg-primary" label="자동화 완료" value={coverage.automatedCases} />
          <LegendDot className="bg-amber-400" label="백로그" value={coverage.candidateCases} />
          <LegendDot className="bg-line-3" label="수동" value={coverage.manualCases} />
        </div>
      </div>
    </section>
  );
};

function LegendDot({ className, label, value }: { className: string; label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 ${className}`} />
      <span>{label}</span>
      <span className="text-text-1 font-medium">{value}</span>
    </span>
  );
}
