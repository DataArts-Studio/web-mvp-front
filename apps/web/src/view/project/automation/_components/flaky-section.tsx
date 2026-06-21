import React from 'react';

import type { CandidateRow } from '@/features/automation-candidates';
import { StatusBadge } from '@testea/ui';
import { AlertTriangle } from 'lucide-react';

import { formatPassRate } from './automation-constants';

interface FlakySectionProps {
  flaky: CandidateRow[];
}

/**
 * 플래키 그룹 ("안정화 먼저 필요").
 *
 * pass·fail 이 공존하고 pass율이 낮아 자동화 ROI 가 낮은 케이스. 후보 액션을 제공하지 않고
 * 왜 플래키인지(pass/fail 분포)만 보여준다.
 */
export const FlakySection = ({ flaky }: FlakySectionProps) => (
  <section className="col-span-6 flex flex-col gap-4">
    <header className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-amber-400" aria-hidden="true" />
        <h3 className="typo-h3-heading text-text-1">안정화 먼저 필요</h3>
        <span className="typo-label-normal text-text-3">{flaky.length}개</span>
      </div>
      <p className="typo-body2-normal text-text-3">
        결과가 들쭉날쭉한 케이스입니다. 자동화 전에 안정화가 먼저 필요합니다.
      </p>
    </header>

    <ul className="flex flex-col gap-3">
      {flaky.map((row) => (
        <li
          key={row.caseId}
          className="rounded-3 border-line-2 bg-bg-2 flex flex-col gap-2 border border-l-4 border-l-amber-400/60 p-4"
        >
          <div className="flex items-center gap-2">
            {row.caseKey && (
              <span className="typo-label-normal text-text-4 shrink-0">{row.caseKey}</span>
            )}
            <span className="typo-body1-normal text-text-1 truncate font-medium">{row.name}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              config={{
                label: `pass ${formatPassRate(row.passRate)}`,
                style: 'bg-amber-500/20 text-amber-300',
              }}
            />
            <span className="typo-label-normal text-text-3">
              {row.distinctRuns}회 실행 · pass {row.passCount} / fail {row.failCount}
              {row.blockedCount > 0 ? ` / blocked ${row.blockedCount}` : ''}
            </span>
          </div>
        </li>
      ))}
    </ul>
  </section>
);
