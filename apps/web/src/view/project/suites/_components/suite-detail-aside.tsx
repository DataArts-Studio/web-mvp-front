'use client';

import React from 'react';

import { useTranslations } from 'next-intl';
import Link from 'next/link';

import type { TestCaseCardType } from '@/entities/test-case';
import type { TestSuiteCard } from '@/entities/test-suite';
import { getLastRunFreshness } from '@/shared/lib';
import { recentSlotsOf } from '@/view/project/cases/_components/case-list-model';
import { cn, formatDate } from '@testea/util';
import { ArrowRight, CheckCircle2, Circle, CircleDot, XCircle } from 'lucide-react';

import { type WatchReason, pickWatchCases, runPassRateOf } from './suite-detail-model';

const RESULT_TONE = {
  pass: 'bg-result-pass',
  fail: 'bg-result-fail',
  blocked: 'bg-result-blocked',
  untested: 'bg-white/[0.12]',
} as const;

const REASON_TONE: Record<WatchReason['kind'], string> = {
  newFail: 'text-result-fail',
  stillFailing: 'text-result-fail',
  flaky: 'text-result-blocked',
  automation: 'text-result-pass',
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-[12px] font-medium text-white/50">{children}</h2>
);

interface SuiteDetailAsideProps {
  suite: TestSuiteCard;
  projectSlug: string;
  sectionCount: number;
  cases: TestCaseCardType[];
  onSelectCase: (id: string) => void;
}

export const SuiteDetailAside = ({
  suite,
  projectSlug,
  sectionCount,
  cases,
  onSelectCase,
}: SuiteDetailAsideProps) => {
  const t = useTranslations('suites.detail');
  const watch = pickWatchCases(cases);

  const reasonText = (reason: WatchReason) => {
    switch (reason.kind) {
      case 'newFail':
        return t('watchNewFail');
      case 'stillFailing':
        return t('watchStillFailing', { streak: reason.streak });
      case 'flaky':
        return t('watchFlaky', { fails: reason.fails, total: reason.total });
      case 'automation':
        return t('watchAutomation', { streak: reason.streak });
    }
  };

  const agoText = (date: Date) => {
    const days = getLastRunFreshness(date).daysSince;
    if (days === null) return '';
    return days <= 0 ? t('today') : days === 1 ? t('yesterday') : t('daysAgo', { days });
  };

  return (
    <aside className="flex min-h-0 flex-col gap-6 lg:overflow-y-auto">
      <section className="flex flex-col gap-2.5">
        <SectionTitle>{t('properties')}</SectionTitle>
        <dl className="grid grid-cols-[80px_minmax(0,1fr)] gap-x-3 gap-y-2.5 text-[12px]">
          <dt className="text-white/40">{t('milestone')}</dt>
          <dd className="min-w-0">
            {suite.linkedMilestone ? (
              <Link
                href={`/projects/${projectSlug}/milestones/${suite.linkedMilestone.id}`}
                className="inline-block max-w-full truncate rounded-[4px] bg-white/[0.07] px-1.5 py-0.5 text-[11px] text-white/80 hover:bg-white/[0.12]"
              >
                {suite.linkedMilestone.title}
              </Link>
            ) : (
              <span className="text-white/30">-</span>
            )}
          </dd>
          <dt className="text-white/40">{t('composition')}</dt>
          <dd className="text-white/80">
            {t('compositionValue', { sections: sectionCount, cases: cases.length })}
          </dd>
          <dt className="text-white/40">{t('created')}</dt>
          <dd className="font-mono text-white/80">{formatDate(suite.createdAt)}</dd>
          {suite.includedPaths.length > 0 && (
            <>
              <dt className="text-white/40">{t('includedPaths')}</dt>
              <dd className="flex min-w-0 flex-col gap-1">
                {suite.includedPaths.map((path) => (
                  <code key={path} className="truncate font-mono text-[11px] text-white/70">
                    {path}
                  </code>
                ))}
              </dd>
            </>
          )}
        </dl>
      </section>

      <section className="flex flex-col gap-1">
        <SectionTitle>{t('watchTitle')}</SectionTitle>
        {watch.length === 0 ? (
          <p className="pt-1.5 text-[12px] text-white/35">{t('watchEmpty')}</p>
        ) : (
          <ul>
            {watch.map(({ testCase, reason }) => (
              <li key={testCase.id} className="border-b border-white/[0.06] last:border-b-0">
                <button
                  type="button"
                  onClick={() => onSelectCase(testCase.id)}
                  className="flex w-full flex-col gap-1.5 py-2.5 text-left hover:bg-white/[0.02]"
                >
                  <span className="flex min-w-0 items-center gap-2 text-[12px]">
                    <span className="shrink-0 font-mono text-white/45">{testCase.caseKey}</span>
                    <span className="truncate text-white/85">{testCase.title}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="flex gap-[2px]" aria-hidden="true">
                      {recentSlotsOf(testCase.recentResults).map((status, i) => (
                        <span
                          key={i}
                          className={cn(
                            'h-2.5 w-[5px] rounded-[1px]',
                            status ? RESULT_TONE[status] : 'bg-white/[0.07]'
                          )}
                        />
                      ))}
                    </span>
                    <span className={cn('text-[11px]', REASON_TONE[reason.kind])}>
                      {reasonText(reason)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <SectionTitle>{t('recentRuns')}</SectionTitle>
          <Link
            href={`/projects/${projectSlug}/runs`}
            className="text-primary inline-flex items-center gap-1 text-[12px] hover:underline"
          >
            {t('recentRunsAll')}
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>
        {suite.recentRuns.length === 0 ? (
          <p className="pt-1.5 text-[12px] text-white/35">{t('recentRunsEmpty')}</p>
        ) : (
          <ul>
            {suite.recentRuns.slice(0, 5).map((run) => {
              const rate = runPassRateOf(run);
              const statusLabel = t(`runStatus.${run.status}`);
              return (
                <li key={run.runId} className="border-b border-white/[0.06] last:border-b-0">
                  <Link
                    href={`/projects/${projectSlug}/runs/${run.runId}`}
                    className="flex items-center gap-2.5 py-2.5 text-[12px] hover:bg-white/[0.02]"
                  >
                    <span className="flex shrink-0" title={statusLabel}>
                      {run.status === 'failed' || run.status === 'blocked' ? (
                        <XCircle
                          className={cn(
                            'h-3.5 w-3.5',
                            run.status === 'failed' ? 'text-result-fail' : 'text-result-blocked'
                          )}
                          aria-hidden="true"
                        />
                      ) : run.status === 'passed' ? (
                        <CheckCircle2 className="text-result-pass h-3.5 w-3.5" aria-hidden="true" />
                      ) : run.status === 'running' ? (
                        <CircleDot className="text-result-running h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 text-white/30" aria-hidden="true" />
                      )}
                      <span className="sr-only">{statusLabel}</span>
                    </span>
                    <span className="min-w-0 flex-1 truncate text-white/85">{run.name}</span>
                    <span className="shrink-0 font-bold text-white/90">
                      {rate === null ? '-' : `${rate}%`}
                    </span>
                    <span className="w-12 shrink-0 text-right text-[11px] whitespace-nowrap text-white/35">
                      {agoText(run.runAt)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </aside>
  );
};
