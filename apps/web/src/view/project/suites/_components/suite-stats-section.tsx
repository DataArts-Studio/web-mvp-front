'use client';
import { useTranslations } from 'next-intl';

import type { TestSuiteCard } from '@/entities/test-suite';
import { ListChecks, PlayCircle } from 'lucide-react';

type SuiteStatsSectionProps = {
  suite: TestSuiteCard;
};

export const SuiteStatsSection = ({ suite }: SuiteStatsSectionProps) => {
  const t = useTranslations('suites');
  const passedCount = suite.lastRun?.counts.passed ?? 0;
  const totalCount = suite.lastRun?.total ?? suite.caseCount;
  const passRate = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;

  return (
    <section aria-label={t('ui.statsAriaLabel')} className="border-line-2 border-b pb-5">
      <h2 className="text-text-3 mb-3 text-xs font-semibold tracking-wide uppercase">
        {t('ui.statsAriaLabel')}
      </h2>
      <div className="border-line-2 bg-line-2 grid grid-cols-2 gap-px overflow-hidden border">
        <div className="bg-bg-1 px-3 py-3">
          <div className="text-text-3 flex items-center gap-1.5 text-xs">
            <ListChecks className="h-3.5 w-3.5" strokeWidth={1.7} aria-hidden="true" />
            <span>{t('ui.testCases')}</span>
          </div>
          <span className="text-text-1 mt-1 block text-xl font-semibold tabular-nums">
            {suite.caseCount}
          </span>
        </div>
        <div className="bg-bg-1 px-3 py-3">
          <div className="text-text-3 flex items-center gap-1.5 text-xs">
            <PlayCircle className="h-3.5 w-3.5" strokeWidth={1.7} aria-hidden="true" />
            <span>{t('ui.executionHistory')}</span>
          </div>
          <span className="text-text-1 mt-1 block text-xl font-semibold tabular-nums">
            {suite.executionHistoryCount}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-text-3">{t('ui.lastRunPassRate')}</span>
          <span className="text-text-1 font-semibold tabular-nums">{passRate}%</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={passRate}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t('ui.lastRunPassRateAriaLabel', { rate: passRate })}
          className="bg-bg-3 h-1.5 w-full"
        >
          <div className="bg-primary h-full" style={{ width: `${passRate}%` }} />
        </div>
        <p className="text-text-3 mt-2 text-xs">
          {t('ui.casesPassed', { passed: passedCount, total: totalCount })}
        </p>
      </div>
    </section>
  );
};
