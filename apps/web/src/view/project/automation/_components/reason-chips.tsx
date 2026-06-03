import React from 'react';

import type { CandidateReasons, CandidateRow } from '@/features/automation-candidates';
import { cn } from '@testea/util';
import { Clock, Repeat, ShieldCheck } from 'lucide-react';

import { formatPassRate } from './automation-constants';

interface ReasonChipProps {
  active: boolean;
  icon: React.ReactNode;
  label: string;
}

/**
 * 추천 근거 칩 1개. 충족(active)이면 강조 색상, 미충족이면 흐린 색상으로 구분한다.
 */
const ReasonChip = ({ active, icon, label }: ReasonChipProps) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
      active ? 'bg-primary/15 text-primary' : 'bg-bg-3 text-text-4'
    )}
  >
    {icon}
    {label}
  </span>
);

interface ReasonChipsProps {
  reasons: CandidateReasons;
  row: Pick<CandidateRow, 'distinctRuns' | 'passRate' | 'daysSinceLastRun'>;
}

/**
 * 후보의 추천 근거(빈도/안정/최근)를 칩으로 표시한다.
 * 각 칩에는 실제 수치를 함께 담아 "5회 실행 / pass 100% / 4일 전" 식으로 읽히게 한다.
 */
export const ReasonChips = ({ reasons, row }: ReasonChipsProps) => {
  const recencyLabel =
    row.daysSinceLastRun === null
      ? '실행 이력 없음'
      : row.daysSinceLastRun <= 0
        ? '오늘 실행'
        : row.daysSinceLastRun === 1
          ? '어제 실행'
          : `${row.daysSinceLastRun}일 전 실행`;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <ReasonChip
        active={reasons.frequent}
        icon={<Repeat className="h-3 w-3" aria-hidden="true" />}
        label={`${row.distinctRuns}회 실행`}
      />
      <ReasonChip
        active={reasons.stable}
        icon={<ShieldCheck className="h-3 w-3" aria-hidden="true" />}
        label={`pass ${formatPassRate(row.passRate)}`}
      />
      <ReasonChip
        active={reasons.recent}
        icon={<Clock className="h-3 w-3" aria-hidden="true" />}
        label={recencyLabel}
      />
    </div>
  );
};
