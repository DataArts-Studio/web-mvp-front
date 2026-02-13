import React from 'react';

import type { TestCaseCardType } from '@/entities/test-case';
import { MoreHorizontal } from 'lucide-react';
import { formatDate } from '@/shared/utils/date-format';

interface TestCaseCardProps {
  testCase: TestCaseCardType;
}

const STATUS_CONFIG = {
  untested: { label: 'Untested', className: 'bg-bg-4 text-text-3' },
  passed: { label: 'Pass', className: 'bg-primary/10 text-primary' },
  failed: { label: 'Fail', className: 'bg-system-red/10 text-system-red' },
  blocked: { label: 'Blocked', className: 'bg-bg-4 text-text-3 line-through' },
} as const;

export const TestCaseCard = ({ testCase }: TestCaseCardProps) => {
  const cfg = STATUS_CONFIG[testCase.status];
  const timeText = testCase.lastExecutedAt ? formatDate(testCase.lastExecutedAt) : '방금 전';

  return (
    <>
      <div className="col-span-2">
        <span className="typo-body2-heading text-text-1 group-hover:text-primary transition-colors">
          {testCase.caseKey}
        </span>
      </div>

      <div className="col-span-4 flex flex-col gap-1">
        <span className="typo-body2-heading text-text-1 group-hover:text-primary transition-colors">
          {testCase.title}
        </span>
        <span className="typo-caption-normal text-text-3 hover:underline">
          {testCase.suiteTitle}
        </span>
      </div>

      <div className="col-span-2 flex justify-center">
        <span
          className={`typo-caption-heading rounded-1 inline-flex items-center px-2 py-1 ${cfg.className}`}
        >
          {cfg.label}
        </span>
      </div>

      <div className="typo-caption-normal text-text-3 col-span-3 text-center">{timeText}</div>

      <div className="col-span-1 flex justify-end">
        <button
          className="rounded-1 text-text-3 hover:bg-bg-4 hover:text-text-1 p-1 transition-colors cursor-pointer group"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
    </>
  );
};
