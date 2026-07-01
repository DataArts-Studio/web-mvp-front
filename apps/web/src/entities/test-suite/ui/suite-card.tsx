'use client';
import React from 'react';

import { useTranslations } from 'next-intl';
import Link from 'next/link';

import { TestSuiteCard } from '@/entities/test-suite';
import { LastRunFreshnessLabel } from '@/shared';
import { formatDate } from '@testea/util';

interface SuiteCardProps {
  suite: TestSuiteCard;
  href: string;
  projectSlug: string;
  onEdit: () => void;
}

export const SuiteCard = ({ suite, href, projectSlug, onEdit }: SuiteCardProps) => {
  const t = useTranslations('suites');
  const titleId = React.useId();
  const descId = React.useId();

  const lastRunDateText = suite.lastRun ? formatDate(suite.lastRun.runAt) : t('ui.none');
  const failed = suite.lastRun?.counts.failed ?? 0;
  const blocked = suite.lastRun?.counts.blocked ?? 0;
  const hasIssue = failed > 0 || blocked > 0;
  const issueText = suite.lastRun
    ? hasIssue
      ? t('count.issueSummary', { failed, blocked })
      : t('ui.issueNone')
    : t('ui.noLastRun');
  const issueDotClass = suite.lastRun
    ? hasIssue
      ? 'bg-system-red'
      : 'bg-system-green'
    : 'bg-bg-4';
  const descriptionText = suite.description ?? t('ui.noDescription');

  const srSummary = [
    t('ui.srTestSuite', { title: suite.title }),
    t('ui.srLastRun', { date: lastRunDateText }),
    t('ui.srLastRunResult', { result: issueText }),
  ].join('. ');

  const handleEditClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onEdit();
  };

  const actionClass =
    'typo-caption-normal text-text-3 hover:text-primary focus-visible:ring-primary/40 focus-visible:ring-2 focus-visible:outline-none';

  return (
    <article
      className="border-line-2 hover:bg-bg-2 grid grid-cols-1 gap-3 border-b px-1 py-4 transition-colors last:border-b-0 md:grid-cols-[minmax(0,1fr)_220px] md:items-start md:gap-6"
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      <p className="sr-only">{srSummary}</p>
      <div className="min-w-0">
        <Link
          href={href}
          id={titleId}
          className="typo-body2-heading text-text-1 hover:text-primary focus-visible:ring-primary/40 block min-w-0 truncate focus-visible:ring-2 focus-visible:outline-none"
        >
          {suite.title}
        </Link>
        <p id={descId} className="typo-caption-normal text-text-4 mt-1 line-clamp-1">
          {descriptionText}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link href={`/projects/${projectSlug}/runs/create`} className={actionClass}>
            {t('ui.runTest')}
          </Link>
          <span className="text-text-4" aria-hidden="true">
            /
          </span>
          <Link href={href} className={actionClass}>
            {t('ui.includedTestCases')}
          </Link>
          <span className="text-text-4" aria-hidden="true">
            /
          </span>
          <Link href={href} className={actionClass}>
            {t('ui.runHistory')}
          </Link>
          <span className="text-text-4" aria-hidden="true">
            /
          </span>
          <button type="button" onClick={handleEditClick} className={actionClass}>
            {t('ui.edit')}
          </button>
        </div>
      </div>

      <div className="min-w-0 md:text-right">
        <div className="flex min-w-0 items-center gap-2 md:justify-end">
          <span className={`h-2 w-2 shrink-0 rounded-full ${issueDotClass}`} aria-hidden="true" />
          <span className="typo-caption-normal text-text-2 min-w-0 truncate">{issueText}</span>
        </div>
        <p className="typo-caption-normal text-text-4 mt-1 truncate">{lastRunDateText}</p>
        <LastRunFreshnessLabel
          lastExecutedAt={suite.lastExecutedAt}
          className="typo-caption-normal text-text-4 mt-0.5 truncate md:justify-end"
          showIcon={false}
        />
      </div>
    </article>
  );
};
