import React from 'react';

import { getLastRunFreshness } from '@/shared/lib';
import { cn } from '@testea/util';
import { History } from 'lucide-react';

interface LastRunFreshnessLabelProps {
  /** 스위트/마일스톤의 마지막 실행 시점 (raw timestamp) */
  lastExecutedAt: Date | string | null | undefined;
  /** 임계일 (일). 미지정 시 기본값(30일) */
  thresholdDays?: number;
  className?: string;
  /** 아이콘 노출 여부 (기본 true) */
  showIcon?: boolean;
}

/**
 * 마지막 실행 경과 라벨 (FDD-TR12 회귀 반복 실행 유도).
 *
 * - 이력 없음: `실행 이력 없음`
 * - 이력 있음: `마지막 실행 N일 전` (오늘/어제는 자연어)
 * - 임계일(기본 30일) 초과 시: 굵은 글씨 + `(회귀 점검 필요)` 텍스트 라벨 + 경고 색상 토큰
 */
export const LastRunFreshnessLabel = ({
  lastExecutedAt,
  thresholdDays,
  className,
  showIcon = true,
}: LastRunFreshnessLabelProps) => {
  const { label, isStale, hasRun } = getLastRunFreshness(lastExecutedAt, thresholdDays);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5',
        !hasRun && 'text-text-4',
        hasRun && !isStale && 'text-text-3',
        isStale && 'font-semibold text-amber-400',
        className
      )}
    >
      {showIcon && <History className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />}
      <span>
        {label}
        {isStale && <span className="ml-1">(회귀 점검 필요)</span>}
      </span>
    </span>
  );
};
