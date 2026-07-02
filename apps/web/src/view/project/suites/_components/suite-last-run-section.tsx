'use client';
import { useTranslations } from 'next-intl';

import type { TestSuiteCard } from '@/entities/test-suite';
import { cn } from '@testea/util';
import { formatDateTime } from '@testea/util';

import { RUN_STATUS_CONFIG } from './suite-detail-constants';

type SuiteLastRunSectionProps = {
  lastRun: NonNullable<TestSuiteCard['lastRun']>;
};

export const SuiteLastRunSection = ({ lastRun }: SuiteLastRunSectionProps) => {
  const t = useTranslations('suites');
  return (
    <section aria-labelledby="suite-last-run-heading" className="border-line-2 border-b pb-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2
          id="suite-last-run-heading"
          className="text-text-3 text-xs font-semibold tracking-wide uppercase"
        >
          {t('ui.lastRun')}
        </h2>
        <span
          className={cn(
            'px-2 py-0.5 text-xs font-medium',
            RUN_STATUS_CONFIG[lastRun.status]?.style ?? RUN_STATUS_CONFIG.not_run.style
          )}
        >
          {RUN_STATUS_CONFIG[lastRun.status]?.label ?? lastRun.status}
        </span>
      </div>
      <p className="text-text-2 mb-3 text-sm">{formatDateTime(lastRun.runAt)}</p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-text-3">Passed</dt>
          <dd className="font-medium text-green-400 tabular-nums">{lastRun.counts.passed}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-text-3">Failed</dt>
          <dd className="font-medium text-red-400 tabular-nums">{lastRun.counts.failed}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-text-3">Blocked</dt>
          <dd className="font-medium text-amber-400 tabular-nums">{lastRun.counts.blocked}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-text-3">Skipped</dt>
          <dd className="text-text-2 font-medium tabular-nums">{lastRun.counts.skipped}</dd>
        </div>
      </dl>
    </section>
  );
};
