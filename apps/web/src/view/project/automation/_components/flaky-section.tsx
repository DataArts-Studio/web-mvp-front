import React from 'react';

import type { CandidateRow } from '@/features/automation-candidates';

import { formatPassRate } from './automation-constants';

interface FlakySectionProps {
  flaky: CandidateRow[];
}

export const FlakySection = ({ flaky }: FlakySectionProps) => (
  <section className="col-span-6 flex flex-col gap-2">
    <header className="flex items-baseline gap-2">
      <h3 className="text-text-1 text-base font-semibold">안정화 먼저 필요</h3>
      <span className="text-text-4 text-sm">{flaky.length}개</span>
    </header>

    <div className="">
      <div className="text-text-4 border-line-3/40 grid grid-cols-[minmax(0,1fr)_80px_120px] gap-3 border-b px-3 py-2 text-xs font-medium">
        <span>케이스</span>
        <span className="text-right">Pass</span>
        <span className="text-right">결과</span>
      </div>
      <ul>
        {flaky.map((row) => (
          <li
            key={row.caseId}
            className="border-line-3/40 hover:bg-bg-2 grid grid-cols-[minmax(0,1fr)_80px_120px] gap-3 border-b px-3 py-2.5 text-sm last:border-b-0"
          >
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                {row.caseKey && <span className="text-text-4 shrink-0 text-xs">{row.caseKey}</span>}
                <span className="text-text-1 truncate font-medium">{row.name}</span>
              </div>
            </div>
            <span className="text-text-3 text-right">{formatPassRate(row.passRate)}</span>
            <span className="text-text-3 text-right">
              pass {row.passCount} / fail {row.failCount}
              {row.blockedCount > 0 ? ` / blocked ${row.blockedCount}` : ''}
            </span>
          </li>
        ))}
      </ul>
    </div>
  </section>
);
