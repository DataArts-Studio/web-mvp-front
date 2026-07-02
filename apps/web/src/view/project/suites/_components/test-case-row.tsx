'use client';
import { useTranslations } from 'next-intl';

import type { TestCaseCardType } from '@/entities/test-case';
import { cn } from '@testea/util';

import { TEST_STATUS_CONFIG } from './suite-detail-constants';

type TestCaseRowProps = {
  testCase: TestCaseCardType;
  onSelect: (id: string) => void;
};

export const TestCaseRow = ({ testCase, onSelect }: TestCaseRowProps) => {
  const t = useTranslations('suites');
  const statusConfig = TEST_STATUS_CONFIG[testCase.resultStatus] ?? TEST_STATUS_CONFIG.untested;

  return (
    <button
      key={testCase.id}
      type="button"
      aria-label={t('ui.caseRowAriaLabel', {
        caseKey: testCase.caseKey,
        title: testCase.title,
        status: statusConfig.label,
      })}
      className={cn(
        'hover:bg-bg-2 grid w-full grid-cols-[132px_minmax(0,1fr)_180px_96px] items-center gap-4 px-3 py-2.5 text-left transition-colors',
        'focus-visible:ring-primary focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset',
        testCase.isOptimistic && 'pointer-events-none animate-pulse opacity-50'
      )}
      onClick={() => onSelect(testCase.id)}
    >
      <span className="text-primary truncate font-mono text-xs">{testCase.caseKey}</span>
      <span className="text-text-1 truncate text-sm">{testCase.title}</span>
      <span className="flex min-w-0 gap-1 overflow-hidden">
        {testCase.tags.slice(0, 2).map((tag: string) => (
          <span
            key={tag}
            className="border-line-2 text-text-3 max-w-20 truncate border px-1.5 py-0.5 text-[11px]"
          >
            {tag}
          </span>
        ))}
      </span>
      <span className={cn('text-right text-xs font-medium', statusConfig.style)}>
        {statusConfig.label}
      </span>
    </button>
  );
};
