import React from 'react';

import type { TestCaseCardType } from '@/entities/test-case';
import { MoreHorizontal } from 'lucide-react';
import { formatDate } from '@/shared/utils/date-format';

interface TestCaseCardProps {
  testCase: TestCaseCardType;
}

export const TestCaseCard = ({ testCase }: TestCaseCardProps) => {
  return (
    <>
      <div className="col-span-2">
        <span className="typo-body2-heading text-text-1 group-hover:text-primary transition-colors">
          {testCase.caseKey}
        </span>
      </div>

      <div className="col-span-6 flex flex-col gap-1">
        <span className="typo-body2-heading text-text-1 group-hover:text-primary transition-colors">
          {testCase.title}
        </span>
        <span className="typo-caption-normal text-text-3 hover:underline">
          {testCase.suiteTitle}
        </span>
      </div>

      <div className="typo-caption-normal text-text-3 col-span-3 text-center">
        {formatDate(testCase.updatedAt)}
      </div>

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
