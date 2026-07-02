'use client';
import React from 'react';

import type { AutomationStatus, CandidateRow } from '@/features/automation-candidates';
import { DSButton } from '@testea/ui';
import { Check } from 'lucide-react';

interface BacklogSectionProps {
  backlog: CandidateRow[];
  pendingCaseId: string | null;
  onSetStatus: (caseId: string, status: AutomationStatus) => void;
}

const confidenceText: Record<CandidateRow['decision']['confidence'], string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
};

export const BacklogSection = ({ backlog, pendingCaseId, onSetStatus }: BacklogSectionProps) => (
  <section className="col-span-2 flex flex-col gap-2">
    <header className="flex items-baseline gap-2">
      <h3 className="text-text-1 text-base font-semibold">자동화 백로그</h3>
      <span className="text-text-4 text-sm">{backlog.length}개</span>
    </header>

    <div className="border-line-3/40 border-t">
      {backlog.length === 0 ? (
        <div className="py-5 text-sm">
          <p className="text-text-1 font-medium">지정된 백로그가 없습니다.</p>
          <p className="text-text-4 mt-1">추천 후보에서 대상을 지정하면 여기에 쌓입니다.</p>
        </div>
      ) : (
        <ul>
          {backlog.slice(0, 6).map((row) => {
            const isPending = pendingCaseId === row.caseId;
            return (
              <li key={row.caseId} className="border-line-3/40 border-b py-3 last:border-b-0">
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    {row.caseKey && <span className="text-text-4 shrink-0 text-xs">{row.caseKey}</span>}
                    <span className="text-text-1 truncate text-sm font-medium">{row.name}</span>
                  </div>
                  <div className="text-text-4 mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                    <span>신뢰도 {confidenceText[row.decision.confidence]}</span>
                    <span>절감 {row.decision.estimatedManualRunsSaved}회</span>
                  </div>
                </div>
                <div className="mt-2 flex justify-end gap-1.5">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => onSetStatus(row.caseId, 'manual')}
                    className="text-text-3 hover:text-text-1 px-2 py-1 text-xs transition-colors disabled:opacity-50"
                  >
                    해제
                  </button>
                  <DSButton
                    variant="solid"
                    size="small"
                    disabled={isPending}
                    onClick={() => onSetStatus(row.caseId, 'automated')}
                    className="flex h-7 items-center gap-1 px-2.5 text-xs"
                  >
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    완료
                  </DSButton>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  </section>
);
