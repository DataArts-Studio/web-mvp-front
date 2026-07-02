import React from 'react';

import type { AutomationCoverageResult, CandidateRow } from '@/features/automation-candidates';

interface SuitePrioritySectionProps {
  coverage: AutomationCoverageResult;
  candidates: CandidateRow[];
  flaky: CandidateRow[];
}

export const SuitePrioritySection = ({ coverage, candidates, flaky }: SuitePrioritySectionProps) => {
  const candidateCountBySuite = countBySuite(candidates);
  const flakyCountBySuite = countBySuite(flaky);

  const rows = coverage.bySuite
    .map((suite) => {
      const candidateCount = candidateCountBySuite.get(suite.suiteId) ?? 0;
      const flakyCount = flakyCountBySuite.get(suite.suiteId) ?? 0;
      const priorityScore =
        (100 - suite.coveragePercent) * 0.7 + candidateCount * 12 - flakyCount * 5;
      const action = getAction(candidateCount, flakyCount, suite.coveragePercent);

      return {
        ...suite,
        candidateCount,
        flakyCount,
        priorityScore,
        action,
      };
    })
    .filter((suite) => suite.totalCases > 0)
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 8);

  if (rows.length === 0) return null;

  return (
    <section className="col-span-6 flex flex-col gap-2">
      <header className="flex items-baseline gap-2">
        <h3 className="text-text-1 text-base font-semibold">스위트별 자동화 우선순위</h3>
        <span className="text-text-4 text-sm">상위 {rows.length}개</span>
      </header>

      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="text-text-4 border-line-3/40 grid grid-cols-[minmax(0,1fr)_88px_80px_104px_128px] gap-3 border-b px-3 py-2 text-xs font-medium">
            <span>스위트</span>
            <span className="text-right">커버리지</span>
            <span className="text-right">후보</span>
            <span className="text-right">안정화 필요</span>
            <span className="text-right">우선 액션</span>
          </div>
          <ul>
            {rows.map((suite) => (
              <li
                key={suite.suiteId ?? 'no-suite'}
                className="border-line-3/40 grid grid-cols-[minmax(0,1fr)_88px_80px_104px_128px] gap-3 border-b px-3 py-2.5 text-sm last:border-b-0"
              >
                <div className="min-w-0">
                  <div className="text-text-1 truncate font-medium">{suite.suiteName ?? '미분류'}</div>
                  <div className="text-text-4 mt-0.5 text-xs">
                    완료 {suite.automatedCases} / 전체 {suite.totalCases}
                  </div>
                </div>
                <span className="text-text-3 text-right">{suite.coveragePercent}%</span>
                <span className="text-text-3 text-right">{suite.candidateCount}</span>
                <span className="text-text-3 text-right">{suite.flakyCount}</span>
                <span className="text-text-1 text-right text-xs font-medium">{suite.action}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

function countBySuite(rows: CandidateRow[]) {
  const map = new Map<string | null, number>();
  for (const row of rows) {
    map.set(row.suiteId, (map.get(row.suiteId) ?? 0) + 1);
  }
  return map;
}

function getAction(candidateCount: number, flakyCount: number, coveragePercent: number) {
  if (flakyCount > candidateCount && flakyCount > 0) return '안정화 먼저';
  if (candidateCount >= 3 && coveragePercent < 50) return '후보 검토';
  if (coveragePercent < 30) return '자동화 확대';
  if (candidateCount > 0) return '백로그 전환';
  return '현황 유지';
}
