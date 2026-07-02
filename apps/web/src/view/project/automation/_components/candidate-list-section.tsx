'use client';
import React from 'react';

import type { AutomationStatus, CandidateRow } from '@/features/automation-candidates';

import { CandidateCard } from './candidate-card';

interface CandidateListSectionProps {
  candidates: CandidateRow[];
  pendingCaseId: string | null;
  onSetStatus: (caseId: string, status: AutomationStatus) => void;
}

export const CandidateListSection = ({
  candidates,
  pendingCaseId,
  onSetStatus,
}: CandidateListSectionProps) => (
  <section className="col-span-4 flex flex-col gap-2">
    <header className="flex items-center justify-between">
      <div className="flex items-baseline gap-2">
        <h3 className="text-text-1 text-base font-semibold">추천 자동화 후보</h3>
        <span className="text-text-4 text-sm">{candidates.length}개</span>
      </div>
    </header>

    <div className="overflow-x-auto">
      <div className="min-w-[820px]">
        <div className="text-text-4 border-line-3/40 grid grid-cols-[minmax(0,1fr)_92px_116px_116px_132px] gap-4 border-b px-3 py-2 text-xs font-medium">
          <span>케이스 / 추천 사유</span>
          <span className="text-right">우선순위</span>
          <span className="text-right">실행 이력</span>
          <span className="text-right">안정성</span>
          <span className="text-right">근거 / 작업</span>
        </div>
        <ul>
          {candidates.map((row) => (
            <CandidateCard
              key={row.caseId}
              row={row}
              pendingCaseId={pendingCaseId}
              onSetStatus={onSetStatus}
            />
          ))}
        </ul>
      </div>
    </div>
  </section>
);
