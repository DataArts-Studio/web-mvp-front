'use client';

import React from 'react';

import { useTranslations } from 'next-intl';
import Link from 'next/link';

import type { TestSuiteCard } from '@/entities/test-suite';
import { getLastRunFreshness } from '@/shared/lib';
import { cn, formatDate } from '@testea/util';
import { CheckCircle2, Circle, Flag, XCircle } from 'lucide-react';

import { historySlotsOf, lastPassRateOf, suiteHealthOf } from './suite-list-model';

/** 칸 너비. 머리글과 행이 같은 값을 쓴다. */
export const SUITE_ROW_GRID =
  'grid grid-cols-[16px_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 lg:grid-cols-[16px_minmax(0,1fr)_280px_110px_140px]';

const BAR_TONE: Record<TestSuiteCard['recentRuns'][number]['status'], string> = {
  passed: 'bg-result-pass/80',
  failed: 'bg-result-fail',
  blocked: 'bg-result-blocked',
  running: 'bg-result-running/70',
  not_run: 'bg-white/15',
};

interface SuiteListRowProps {
  suite: TestSuiteCard;
  href: string;
  projectSlug: string;
  onEdit: () => void;
}

export const SuiteListRow = ({ suite, href, projectSlug, onEdit }: SuiteListRowProps) => {
  const t = useTranslations('suites.list');
  const health = suiteHealthOf(suite);
  const passRate = lastPassRateOf(suite);
  const slots = historySlotsOf(suite.recentRuns);
  const runCount = suite.recentRuns.length;
  const freshness = getLastRunFreshness(suite.lastExecutedAt ?? suite.lastRun?.runAt ?? null);
  const days = freshness.daysSince;
  const agoText =
    days === null
      ? null
      : days <= 0
        ? t('today')
        : days === 1
          ? t('yesterday')
          : t('daysAgo', { days });

  const counts = suite.recentRuns.reduce(
    (acc, run) => {
      if (run.status === 'failed') acc.failed += 1;
      else if (run.status === 'blocked') acc.blocked += 1;
      else if (run.status === 'passed') acc.passed += 1;
      return acc;
    },
    { passed: 0, failed: 0, blocked: 0 }
  );

  return (
    <li className="group border-line-2 relative border-b px-2.5 py-3.5 transition-colors hover:bg-white/[0.02]">
      <div className={SUITE_ROW_GRID}>
        <span
          className="flex"
          title={t(
            health === 'issue' ? 'statusIssue' : health === 'ok' ? 'statusOk' : 'statusNone'
          )}
        >
          {health === 'issue' ? (
            <XCircle className="text-result-fail h-4 w-4" aria-hidden="true" />
          ) : health === 'ok' ? (
            <CheckCircle2 className="text-result-pass h-4 w-4" aria-hidden="true" />
          ) : (
            <Circle className="h-4 w-4 text-white/30" strokeDasharray="3 3" aria-hidden="true" />
          )}
          <span className="sr-only">
            {t(health === 'issue' ? 'statusIssue' : health === 'ok' ? 'statusOk' : 'statusNone')}
          </span>
        </span>

        <div className="flex min-w-0 flex-col gap-[3px]">
          <div className="flex min-w-0 items-center gap-2">
            <Link
              href={href}
              className="focus-visible:after:ring-primary/50 truncate text-[14px] font-medium text-white/92 after:absolute after:inset-0 after:content-[''] hover:text-white focus-visible:outline-none focus-visible:after:ring-2"
            >
              {suite.title}
            </Link>
            <button
              type="button"
              onClick={onEdit}
              aria-label={t('editAria', { title: suite.title })}
              className="relative z-10 shrink-0 rounded-[4px] border border-white/15 px-1.5 text-[11px] text-white/70 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:border-white/35 hover:text-white"
            >
              {t('edit')}
            </button>
          </div>
          <p className="flex min-w-0 items-center gap-1.5 text-[11px] text-white/40">
            {suite.description && <span className="truncate">{suite.description}</span>}
            {suite.description && (
              <span aria-hidden="true" className="text-white/25">
                ·
              </span>
            )}
            <span className="shrink-0">{t('cases', { count: suite.caseCount })}</span>
          </p>
        </div>

        <div className="col-span-3 col-start-2 row-start-2 flex flex-col gap-1 lg:col-span-1 lg:col-start-3 lg:row-start-1">
          <div
            className="flex gap-[3px]"
            role="img"
            aria-label={runCount > 0 ? t('historyAria', counts) : t('historyNone')}
          >
            {slots.map((run, i) => (
              <span
                key={run?.runId ?? `empty-${i}`}
                title={
                  run
                    ? t('historyBar', {
                        date: formatDate(run.runAt),
                        passed: run.passed,
                        failed: run.failed,
                        blocked: run.blocked,
                      })
                    : undefined
                }
                className={cn(
                  'h-6 w-1.5 shrink-0 rounded-[1.5px]',
                  run ? BAR_TONE[run.status] : 'bg-white/[0.07]'
                )}
              />
            ))}
          </div>
          <span className="text-[10px] text-white/30">
            {runCount === 0
              ? t('historyNone')
              : runCount >= slots.length
                ? t('historyFull', { count: runCount })
                : t('historyPartial', { count: runCount })}
          </span>
        </div>

        <div className="hidden min-w-0 items-center gap-2 lg:flex">
          {suite.linkedMilestone ? (
            <span className="flex min-w-0 items-center gap-1 rounded-[4px] bg-white/[0.06] px-1.5 py-0.5 text-[11px] text-white/70">
              <Flag className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{suite.linkedMilestone.title}</span>
            </span>
          ) : (
            <span className="text-[12px] text-white/25">-</span>
          )}
        </div>

        <div className="relative z-10 col-start-3 row-start-1 flex flex-col items-end gap-[3px] lg:col-start-5">
          {passRate === null && runCount > 0 ? (
            <span className="text-[12px] whitespace-nowrap text-white/40">{t('noResults')}</span>
          ) : passRate === null ? (
            <Link
              href={`/projects/${projectSlug}/runs/create`}
              className="text-primary text-[12px] font-medium whitespace-nowrap hover:underline"
            >
              {t('firstRun')}
            </Link>
          ) : (
            <>
              <span className="text-[15px] font-bold text-white/95">{passRate}%</span>
              <span
                className={cn(
                  'text-[11px] whitespace-nowrap',
                  freshness.isStale ? 'text-result-blocked font-medium' : 'text-white/40'
                )}
              >
                {agoText}
                {freshness.isStale && `  ·  ${t('stale')}`}
              </span>
            </>
          )}
        </div>
      </div>
    </li>
  );
};
