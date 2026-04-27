'use client';

import React from 'react';
import { cn } from '@/shared/utils';
import { STATUS_CONFIG, type TestCaseRunStatus } from './run-detail-constants';

interface RunSummaryBarProps {
  stats: {
    total: number;
    pass: number;
    fail: number;
    blocked: number;
    untested: number;
    progressPercent: number;
  };
  createdAt?: string;
}

const StatChip = ({ status, count, total }: { status: TestCaseRunStatus; count: number; total: number }) => {
  const config = STATUS_CONFIG[status];
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className={cn('flex items-center gap-1.5 rounded-lg px-2.5 py-1', config.bgStyle.split(' ')[0])}>
      <span className={config.style}>{config.icon}</span>
      <span className={cn('text-sm font-semibold tabular-nums', config.style)}>{count}</span>
      <span className="text-text-4 text-xs tabular-nums">({pct}%)</span>
    </div>
  );
};

/** 텍스트 요약 생성 */
function buildSummaryText(stats: RunSummaryBarProps['stats']): string {
  const { total, pass, fail, blocked, untested, progressPercent } = stats;

  if (total === 0) return '실행할 테스트 케이스가 없습니다.';

  const executed = total - untested;
  const parts: string[] = [];

  // 진행 상황
  if (executed === 0) {
    parts.push(`전체 ${total}건 미실행`);
  } else if (untested === 0) {
    parts.push(`전체 ${total}건 실행 완료 (${progressPercent}%)`);
  } else {
    parts.push(`전체 ${total}건 중 ${executed}건 실행 (${progressPercent}%)`);
  }

  // 문제 케이스 강조
  const issues: string[] = [];
  if (fail > 0) issues.push(`실패 ${fail}건`);
  if (blocked > 0) issues.push(`차단 ${blocked}건`);

  if (issues.length > 0) {
    parts.push(issues.join(', '));
  } else if (executed > 0 && pass === executed) {
    parts.push('모두 통과');
  }

  // 남은 항목
  if (untested > 0 && executed > 0) {
    parts.push(`${untested}건 남음`);
  }

  return parts.join(' · ');
}

export const RunSummaryBar = ({ stats }: RunSummaryBarProps) => {
  const { total, pass, fail, blocked, untested, progressPercent } = stats;

  // Segmented progress bar widths
  const passW = total > 0 ? (pass / total) * 100 : 0;
  const failW = total > 0 ? (fail / total) * 100 : 0;
  const blockedW = total > 0 ? (blocked / total) * 100 : 0;

  const summaryText = buildSummaryText(stats);
  const hasIssues = fail > 0 || blocked > 0;

  return (
    <div className="border-line-2 border-b bg-bg-1 px-6 py-2.5">
      {/* Row 1: Text summary */}
      <p className={cn(
        'text-xs mb-2',
        hasIssues ? 'text-amber-400' : total > 0 && untested === 0 ? 'text-green-400' : 'text-text-3',
      )}>
        {summaryText}
      </p>

      {/* Row 2: Chips + Progress */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <StatChip status="pass" count={pass} total={total} />
          <StatChip status="fail" count={fail} total={total} />
          <StatChip status="blocked" count={blocked} total={total} />
          <StatChip status="untested" count={untested} total={total} />
        </div>

        <div className="flex flex-1 items-center gap-3">
          <div className="bg-bg-4 h-2 flex-1 overflow-hidden rounded-full">
            <div className="flex h-full">
              {passW > 0 && (
                <div className="bg-green-500 h-full transition-all duration-300" style={{ width: `${passW}%` }} />
              )}
              {failW > 0 && (
                <div className="bg-red-500 h-full transition-all duration-300" style={{ width: `${failW}%` }} />
              )}
              {blockedW > 0 && (
                <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${blockedW}%` }} />
              )}
            </div>
          </div>
          <span className="text-text-2 text-sm font-semibold tabular-nums shrink-0">
            {progressPercent}%
          </span>
        </div>

        <div className="bg-bg-3 rounded-lg px-2.5 py-1 shrink-0">
          <span className="text-text-2 text-xs font-medium">총 <span className="text-text-1 font-semibold">{total}</span>건</span>
        </div>
      </div>
    </div>
  );
};
