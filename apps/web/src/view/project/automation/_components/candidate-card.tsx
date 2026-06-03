'use client';
import React from 'react';

import type { AutomationStatus, CandidateRow } from '@/features/automation-candidates';
import { DSButton, StatusBadge } from '@testea/ui';
import { Check } from 'lucide-react';

import { AUTOMATION_STATUS_CONFIG } from './automation-constants';
import { ReasonChips } from './reason-chips';

interface CandidateCardProps {
  row: CandidateRow;
  /** 상태 전이 중인 caseId (버튼 비활성화/스피너용). */
  pendingCaseId: string | null;
  onSetStatus: (caseId: string, status: AutomationStatus) => void;
}

/**
 * 후보 1건 카드.
 *
 * - manual: "자동화 대상으로" 액션 노출 (manual → candidate).
 * - candidate: 상태 배지 + "자동화 완료로" 액션 (candidate → automated), "후보 해제"(→ manual).
 * - automated 는 후보 목록에서 backend 가 제외하므로 여기서는 거의 등장하지 않는다.
 */
export const CandidateCard = ({ row, pendingCaseId, onSetStatus }: CandidateCardProps) => {
  const isPending = pendingCaseId === row.caseId;
  const status = row.automationStatus;

  return (
    <li className="rounded-3 border-line-2 bg-bg-2 hover:border-line-3 flex flex-col gap-3 border p-4 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-2">
            {row.caseKey && (
              <span className="typo-label-normal text-text-4 shrink-0">{row.caseKey}</span>
            )}
            <span className="typo-body1-normal text-text-1 truncate font-medium">{row.name}</span>
          </div>
          <ReasonChips reasons={row.reasons} row={row} />
        </div>
        {status !== 'manual' && (
          <StatusBadge config={AUTOMATION_STATUS_CONFIG[status]} className="shrink-0" />
        )}
      </div>

      <div className="flex items-center justify-end gap-2">
        {status === 'manual' && (
          <DSButton
            variant="ghost"
            size="small"
            disabled={isPending}
            onClick={() => onSetStatus(row.caseId, 'candidate')}
          >
            {isPending ? '처리 중...' : '자동화 대상으로'}
          </DSButton>
        )}
        {status === 'candidate' && (
          <>
            <DSButton
              variant="text"
              size="small"
              disabled={isPending}
              onClick={() => onSetStatus(row.caseId, 'manual')}
            >
              후보 해제
            </DSButton>
            <DSButton
              variant="solid"
              size="small"
              disabled={isPending}
              onClick={() => onSetStatus(row.caseId, 'automated')}
              className="flex items-center gap-1"
            >
              <Check className="h-4 w-4" aria-hidden="true" />
              {isPending ? '처리 중...' : '자동화 완료로'}
            </DSButton>
          </>
        )}
      </div>
    </li>
  );
};
