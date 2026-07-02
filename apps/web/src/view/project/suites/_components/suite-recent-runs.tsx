'use client';
import { useTranslations } from 'next-intl';

import type { TestSuiteCard } from '@/entities/test-suite';
import { EmptyState } from '@testea/ui';
import { cn } from '@testea/util';
import { formatDateTime } from '@testea/util';
import { PlayCircle } from 'lucide-react';

import { RUN_STATUS_CONFIG } from './suite-detail-constants';

type SuiteRecentRunsProps = {
  recentRuns: TestSuiteCard['recentRuns'];
};

export const SuiteRecentRuns = ({ recentRuns }: SuiteRecentRunsProps) => {
  const t = useTranslations('suites');
  return (
    <section aria-labelledby="suite-recent-runs-heading" className="flex flex-col gap-3">
      <h2
        id="suite-recent-runs-heading"
        className="text-text-3 text-xs font-semibold tracking-wide uppercase"
      >
        {t('ui.recentRunsTitle')}
      </h2>

      {recentRuns.length === 0 ? (
        <div className="border-line-2 border border-dashed py-6">
          <EmptyState
            icon={<PlayCircle className="h-6 w-6" aria-hidden="true" />}
            title={t('ui.noRecentRunsTitle')}
            description={t('ui.noRecentRunsDescription')}
          />
        </div>
      ) : (
        <div className="border-line-2 divide-line-2 divide-y border">
          {recentRuns.map((run) => {
            const runStatusConfig = RUN_STATUS_CONFIG[run.status] ?? RUN_STATUS_CONFIG.not_run;
            const runPassRate = run.total > 0 ? Math.round((run.passed / run.total) * 100) : 0;
            return (
              <div key={run.runId} className="hover:bg-bg-2 px-3 py-3 transition-colors">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <span className={cn('px-2 py-0.5 text-xs font-medium', runStatusConfig.style)}>
                    {runStatusConfig.label}
                  </span>
                  <span className="text-text-3 text-right text-xs tabular-nums">
                    {runPassRate}%
                  </span>
                </div>
                <p className="text-text-2 mb-2 text-xs">{formatDateTime(run.runAt)}</p>
                <div
                  role="progressbar"
                  aria-valuenow={runPassRate}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={t('ui.passRateAriaLabel', { rate: runPassRate })}
                  className="bg-bg-3 h-1.5 w-full"
                >
                  <div className="bg-primary h-full" style={{ width: `${runPassRate}%` }} />
                </div>
                <p className="text-text-3 mt-2 text-xs">
                  {run.passed} passed ? {run.failed} failed ? {run.blocked} blocked
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
