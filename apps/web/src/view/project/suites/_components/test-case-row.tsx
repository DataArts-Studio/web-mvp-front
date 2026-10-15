'use client';
import { useTranslations } from 'next-intl';

import type { TestCaseCardType } from '@/entities/test-case';
import { recentSlotsOf } from '@/view/project/cases/_components/case-list-model';
import { cn } from '@testea/util';

import { TEST_STATUS_CONFIG } from './suite-detail-constants';

const RESULT_TONE = {
  pass: 'bg-result-pass',
  fail: 'bg-result-fail',
  blocked: 'bg-result-blocked',
  untested: 'bg-white/[0.12]',
} as const;

type TestCaseRowProps = {
  testCase: TestCaseCardType;
  onSelect: (id: string) => void;
};

export const TestCaseRow = ({ testCase, onSelect }: TestCaseRowProps) => {
  const t = useTranslations('suites');
  const statusConfig = TEST_STATUS_CONFIG[testCase.resultStatus] ?? TEST_STATUS_CONFIG.untested;
  const tags = testCase.tags ?? [];

  return (
    <button
      type="button"
      aria-label={t('ui.caseRowAriaLabel', {
        caseKey: testCase.caseKey,
        title: testCase.title,
        status: statusConfig.label,
      })}
      className={cn(
        'flex w-full items-center gap-3 border-b border-white/[0.05] py-2.5 pr-2.5 pl-6 text-left transition-colors hover:bg-white/[0.03]',
        'focus-visible:ring-primary focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset',
        testCase.isOptimistic && 'pointer-events-none animate-pulse opacity-50'
      )}
      onClick={() => onSelect(testCase.id)}
    >
      <span className="w-[52px] shrink-0 font-mono text-[11px] text-white/40">
        {testCase.caseKey}
      </span>
      <span className="min-w-0 flex-1 truncate text-[13px] text-white/90">{testCase.title}</span>
      {tags.length > 0 && (
        <span className="hidden shrink-0 gap-1 md:flex">
          {tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="max-w-[96px] truncate rounded-[3px] bg-white/[0.08] px-1.5 py-px text-[10.5px] text-white/70"
            >
              {tag}
            </span>
          ))}
        </span>
      )}
      <span className="flex shrink-0 gap-[2px]" aria-hidden="true">
        {recentSlotsOf(testCase.recentResults).map((status, i) => (
          <span
            key={i}
            className={cn(
              'h-3 w-[5px] rounded-[1px]',
              status ? RESULT_TONE[status] : 'bg-white/[0.07]'
            )}
          />
        ))}
      </span>
    </button>
  );
};
