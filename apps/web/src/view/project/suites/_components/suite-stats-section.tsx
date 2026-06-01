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
    <section aria-label={t('ui.statsAriaLabel')} className="col-span-6 grid grid-cols-4 gap-4">
      {/* 테스트 케이스 수 */}
      <div className="bg-bg-2 border-line-2 rounded-4 flex flex-col gap-1 border p-4">
        <div className="text-text-3 flex items-center gap-1.5 text-sm">
          <ListChecks className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          <span>{t('ui.testCases')}</span>
        </div>
        <span className="text-text-1 text-2xl font-bold">
          {t('count.cases', { count: suite.caseCount })}
        </span>
      </div>

      {/* 테스트 실행 횟수 */}
      <div className="bg-bg-2 border-line-2 rounded-4 flex flex-col gap-1 border p-4">
        <div className="text-text-3 flex items-center gap-1.5 text-sm">
          <PlayCircle className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          <span>{t('ui.executionHistory')}</span>
        </div>
        <span className="text-text-1 text-2xl font-bold">
          {t('count.runs', { count: suite.executionHistoryCount })}
        </span>
      </div>

      {/* 통과율 */}
      <div className="bg-bg-2 border-line-2 rounded-4 col-span-2 border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-text-3 font-semibold">{t('ui.lastRunPassRate')}</h3>
          <span className="text-primary text-2xl font-bold">{passRate}%</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={passRate}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t('ui.lastRunPassRateAriaLabel', { rate: passRate })}
          className="bg-bg-3 h-3 w-full rounded-full"
        >
          <div
            className="bg-primary h-full rounded-full transition-all duration-300"
            style={{ width: `${passRate}%` }}
          />
        </div>
        <p className="text-text-3 mt-2 text-sm">
          {t('ui.casesPassed', { passed: passedCount, total: totalCount })}
        </p>
      </div>
    </section>
  );
};
