'use client';
import React from 'react';

import type { AutomationStatus, CandidateRow } from '@/features/automation-candidates';
import { DSButton } from '@testea/ui';
import { Check } from 'lucide-react';

import { formatPassRate } from './automation-constants';

interface CandidateCardProps {
  row: CandidateRow;
  pendingCaseId: string | null;
  onSetStatus: (caseId: string, status: AutomationStatus) => void;
}

const statusText: Record<AutomationStatus, { label: string; className: string }> = {
  manual: { label: '수동', className: 'text-text-3' },
  candidate: { label: '자동화 대상', className: 'text-primary' },
  automated: { label: '자동화 완료', className: 'text-green-500' },
};

const priorityText: Record<CandidateRow['decision']['priority'], { label: string; className: string }> = {
  high: { label: 'High', className: 'text-red-500' },
  medium: { label: 'Medium', className: 'text-amber-500' },
  low: { label: 'Low', className: 'text-text-3' },
};

const confidenceText: Record<CandidateRow['decision']['confidence'], string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
};

const formatRecency = (days: number | null) => {
  if (days === null) return '-';
  if (days <= 0) return '오늘';
  if (days === 1) return '어제';
  return `${days}일 전`;
};

const compactTags = (tags: string[] | null) => (tags ?? []).filter(Boolean).slice(0, 2);

export const CandidateCard = ({ row, pendingCaseId, onSetStatus }: CandidateCardProps) => {
  const isPending = pendingCaseId === row.caseId;
  const status = row.automationStatus;
  const statusConfig = statusText[status];
  const priority = priorityText[row.decision.priority];
  const tags = compactTags(row.tags);

  return (
    <li className="group border-line-3/40 hover:bg-bg-2 grid grid-cols-[minmax(0,1fr)_92px_116px_116px_132px] items-start gap-4 border-b px-3 py-3 text-sm transition-colors last:border-b-0">
      <div className="min-w-0 space-y-1.5">
        <div className="flex min-w-0 items-center gap-2">
          {row.caseKey && <span className="text-text-4 shrink-0 text-xs">{row.caseKey}</span>}
          <span className="text-text-1 truncate font-medium">{row.name}</span>
        </div>
        <p className="text-text-3 line-clamp-2 text-xs leading-5">
          {row.decision.recommendationReason}
        </p>
        <div className="text-text-4 flex min-w-0 flex-wrap gap-x-2 gap-y-1 text-xs">
          {row.testType && <span>{row.testType}</span>}
          {tags.map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
          <span>{statusConfig.label}</span>
        </div>
      </div>

      <div className="space-y-1 text-right">
        <div className={`${priority.className} text-sm font-semibold`}>{priority.label}</div>
        <div className="text-text-4 text-xs">점수 {Math.round(row.score)}</div>
        <div className="text-text-4 text-xs">신뢰도 {confidenceText[row.decision.confidence]}</div>
      </div>

      <div className="space-y-1 text-right">
        <div className="text-text-1 font-medium">{row.distinctRuns}회 실행</div>
        <div className="text-text-4 text-xs">결과 {row.evaluatedResults}건</div>
        <div className="text-text-4 text-xs">최근 {formatRecency(row.daysSinceLastRun)}</div>
      </div>

      <div className="space-y-1 text-right">
        <div className="text-text-1 font-medium">{formatPassRate(row.passRate)}</div>
        <div className="text-text-4 text-xs">
          pass {row.passCount} / fail {row.failCount}
        </div>
        <div className="text-text-4 text-xs">절감 예상 {row.decision.estimatedManualRunsSaved}회</div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <div className="text-text-4 flex max-w-[132px] flex-wrap justify-end gap-x-2 gap-y-1 text-xs">
          {row.decision.signalLabels.slice(0, 3).map((label) => (
            <span key={label}>{label}</span>
          ))}
          {row.decision.riskLabels.slice(0, 2).map((label) => (
            <span key={label} className="text-amber-500">
              {label}
            </span>
          ))}
        </div>

        <div className="flex justify-end gap-1.5">
          {status === 'manual' && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => onSetStatus(row.caseId, 'candidate')}
              className="border-line-3/40 text-text-2 hover:bg-bg-2 border px-2.5 py-1 text-xs transition-colors disabled:opacity-50"
            >
              {isPending ? '처리 중' : '대상 지정'}
            </button>
          )}
          {status === 'candidate' && (
            <>
              <button
                type="button"
                disabled={isPending}
                onClick={() => onSetStatus(row.caseId, 'manual')}
                className="text-text-3 hover:text-text-1 px-2.5 py-1 text-xs transition-colors disabled:opacity-50"
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
                {isPending ? '처리 중' : '완료'}
              </DSButton>
            </>
          )}
        </div>
      </div>
    </li>
  );
};
