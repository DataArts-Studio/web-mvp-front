'use client';
import React from 'react';

import type { AutomationStatus, CandidateRow } from '@/features/automation-candidates';
import { Sparkles } from 'lucide-react';

import { CandidateCard } from './candidate-card';

interface CandidateListSectionProps {
  candidates: CandidateRow[];
  pendingCaseId: string | null;
  onSetStatus: (caseId: string, status: AutomationStatus) => void;
}

/**
 * 자동화 추천 후보 리스트 섹션 (점수 내림차순은 backend 가 보장).
 */
export const CandidateListSection = ({
  candidates,
  pendingCaseId,
  onSetStatus,
}: CandidateListSectionProps) => (
  <section className="col-span-6 flex flex-col gap-4">
    <header className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Sparkles className="text-primary h-5 w-5" aria-hidden="true" />
        <h3 className="typo-h3-heading text-text-1">추천 자동화 후보</h3>
        <span className="typo-label-normal text-text-3">{candidates.length}개</span>
      </div>
      <p className="typo-body2-normal text-text-3">
        반복 실행 빈도·결과 안정성·최근성을 기준으로 자동화 효과가 큰 케이스를 추천합니다.
      </p>
    </header>

    <ul className="flex flex-col gap-3">
      {candidates.map((row) => (
        <CandidateCard
          key={row.caseId}
          row={row}
          pendingCaseId={pendingCaseId}
          onSetStatus={onSetStatus}
        />
      ))}
    </ul>
  </section>
);
