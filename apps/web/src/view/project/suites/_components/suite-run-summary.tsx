'use client';

import React from 'react';

import { useTranslations } from 'next-intl';

import type { TestSuiteCard } from '@/entities/test-suite';
import { getLastRunFreshness } from '@/shared/lib';
import { cn, formatDate } from '@testea/util';

import { summarizeSuiteRuns } from './suite-detail-model';
import { HISTORY_SLOTS, historySlotsOf } from './suite-list-model';

const BAR_TONE: Record<TestSuiteCard['recentRuns'][number]['status'], string> = {
  passed: 'bg-result-pass/85',
  failed: 'bg-result-fail',
  blocked: 'bg-result-blocked',
  running: 'bg-result-running/70',
  not_run: 'bg-white/15',
};

const shortDate = (date: Date) => {
  const d = new Date(date);
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

const Metric = ({
  label,
  value,
  note,
  noteTone = 'muted',
}: {
  label: string;
  value: React.ReactNode;
  note?: React.ReactNode;
  noteTone?: 'muted' | 'bad' | 'good';
}) => (
  <div className="flex min-w-0 flex-col gap-1 lg:border-l lg:border-white/[0.08] lg:pl-6">
    <span className="text-[11px] text-white/45">{label}</span>
    <span className="text-[22px] leading-tight font-bold text-white">{value}</span>
    {note && (
      <span
        className={cn(
          'truncate text-[11px]',
          noteTone === 'bad'
            ? 'text-result-fail'
            : noteTone === 'good'
              ? 'text-result-pass'
              : 'text-white/40'
        )}
      >
        {note}
      </span>
    )}
  </div>
);

export const SuiteRunSummary = ({ suite }: { suite: TestSuiteCard }) => {
  const t = useTranslations('suites.detail');
  const runs = suite.recentRuns;
  const slots = historySlotsOf(runs);
  const summary = summarizeSuiteRuns(runs);
  const firstRun = slots.find((slot) => slot !== null) ?? null;
  // 마지막 실행 시점은 케이스 결과 기록 시각을 우선한다. 그 값은 어느 실행의 것인지 알 수 없어,
  // 실행 생성 시각으로 대신할 때만 실행 이름을 함께 보여 준다.
  const lastRunNote = suite.lastExecutedAt ? undefined : summary.lastRun?.name;
  const days = getLastRunFreshness(
    suite.lastExecutedAt ?? summary.lastRun?.runAt ?? null
  ).daysSince;
  const agoText =
    days === null
      ? '-'
      : days <= 0
        ? t('today')
        : days === 1
          ? t('yesterday')
          : t('daysAgo', { days });
  const delta =
    summary.lastRate !== null && summary.prevRate !== null
      ? summary.lastRate - summary.prevRate
      : null;

  return (
    <section
      aria-label={t('historyTitle', { count: HISTORY_SLOTS })}
      className="border-line-2 grid grid-cols-1 gap-5 rounded-[8px] border px-5 py-4 lg:grid-cols-[minmax(0,1fr)_repeat(3,170px)]"
    >
      <div className="flex min-w-0 flex-col gap-2">
        <p className="flex items-baseline gap-2">
          <span className="text-[12px] font-medium text-white/75">
            {t('historyTitle', { count: HISTORY_SLOTS })}
          </span>
          <span className="text-[11px] text-white/30">{t('historyHint')}</span>
        </p>
        {runs.length === 0 ? (
          <p className="flex h-9 items-center text-[12px] text-white/35">{t('historyEmpty')}</p>
        ) : (
          <>
            <div className="flex h-9 items-end gap-[3px]">
              {slots.map((run, i) => (
                <span
                  key={run?.runId ?? `empty-${i}`}
                  title={
                    run
                      ? t('historyBar', {
                          date: formatDate(run.runAt),
                          name: run.name,
                          passed: run.passed,
                          failed: run.failed,
                          blocked: run.blocked,
                        })
                      : undefined
                  }
                  className={cn(
                    'h-full min-w-0 flex-1 rounded-[2px]',
                    run ? BAR_TONE[run.status] : 'bg-white/[0.05]'
                  )}
                />
              ))}
            </div>
            <div className="flex justify-between font-mono text-[10px] text-white/35">
              <span>{firstRun ? shortDate(firstRun.runAt) : ''}</span>
              <span>{summary.lastRun ? shortDate(summary.lastRun.runAt) : ''}</span>
            </div>
          </>
        )}
      </div>

      <Metric
        label={t('passRate')}
        value={summary.lastRate === null ? '-' : `${summary.lastRate}%`}
        note={
          delta === null
            ? t('passRateNoPrev')
            : t('passRateDelta', {
                prev: summary.prevRate ?? 0,
                delta: delta > 0 ? `+${delta}` : `${delta}`,
              })
        }
        noteTone={delta === null || delta === 0 ? 'muted' : delta < 0 ? 'bad' : 'good'}
      />
      <Metric
        label={t('failedRuns')}
        value={
          <>
            {summary.failedRuns}
            <span className="text-[16px] font-medium text-white/40"> / {summary.totalRuns}</span>
          </>
        }
        note={
          summary.recentWindow > 0
            ? t('failedRunsRecent', {
                window: summary.recentWindow,
                count: summary.recentFailedRuns,
              })
            : undefined
        }
      />
      <Metric label={t('lastRun')} value={agoText} note={lastRunNote} />
    </section>
  );
};
