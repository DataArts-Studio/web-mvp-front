'use client';
import React, { useMemo } from 'react';

import { useTranslations } from 'next-intl';

import { TestSuiteCard } from '@/entities/test-suite';
import { DSButton, LastRunFreshnessLabel } from '@/shared';
import { formatDate } from '@testea/util';
import { AlertCircle, FileText, FolderTree, Layers, PlayCircle } from 'lucide-react';
import { Edit } from 'lucide-react';

interface SuiteCardProps {
  suite: TestSuiteCard;
  onEdit: () => void;
}

export const SuiteCard = ({ suite, onEdit }: SuiteCardProps) => {
  const t = useTranslations('suites');
  const titleId = React.useId();
  const descId = React.useId();

  const tagToneText = (tone: TestSuiteCard['tag']['tone']) => {
    switch (tone) {
      case 'info':
        return t('ui.tagInfo');
      case 'success':
        return t('ui.tagSuccess');
      case 'warning':
        return t('ui.tagWarning');
      case 'danger':
        return t('ui.tagDanger');
      default:
        return t('ui.tagNeutral');
    }
  };

  // 서버가 내려준 tag.label('기본') 대신 톤 기반 번역 라벨을 표시한다.
  const tagLabel = tagToneText(suite.tag.tone);

  const primaryPath = suite.includedPaths?.[0] ?? '-';
  const milestoneText = suite.linkedMilestone
    ? `${suite.linkedMilestone.versionLabel} ${suite.linkedMilestone.title}`
    : t('ui.none');

  const lastRunDateText = suite.lastRun ? formatDate(suite.lastRun.runAt) : t('ui.none');

  const failed = suite.lastRun?.counts.failed ?? 0;
  const blocked = suite.lastRun?.counts.blocked ?? 0;

  const hasIssue = failed > 0 || blocked > 0;
  const issueText = suite.lastRun
    ? hasIssue
      ? t('count.issueSummary', { failed, blocked })
      : t('ui.issueNone')
    : t('ui.noLastRun');

  const issueIconClass = suite.lastRun
    ? hasIssue
      ? 'text-system-red'
      : 'text-system-green'
    : 'text-text-3';

  const tagToneClass = (() => {
    switch (suite.tag.tone) {
      case 'info':
      case 'success':
      case 'warning':
      case 'danger':
      default:
        return 'bg-bg-3 text-text-2';
    }
  })();

  const descriptionText = suite.description ?? t('ui.noDescription');

  const srSummary = useMemo(() => {
    return [
      t('ui.srTestSuite', { title: suite.title }),
      t('ui.srTag', { label: tagLabel }),
      t('ui.srTagTone', { tone: tagToneText(suite.tag.tone) }),
      t('ui.srPath', { path: primaryPath }),
      t('ui.srCaseCount', { count: t('count.cases', { count: suite.caseCount }) }),
      t('ui.srMilestone', { milestone: milestoneText }),
      t('ui.srLastRun', { date: lastRunDateText }),
      t('ui.srLastRunResult', { result: issueText }),
      t('ui.srRunHistory', { count: t('count.runs', { count: suite.executionHistoryCount }) }),
    ].join('. ');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    suite.title,
    tagLabel,
    suite.tag.tone,
    primaryPath,
    suite.caseCount,
    milestoneText,
    lastRunDateText,
    issueText,
    suite.executionHistoryCount,
  ]);

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onEdit();
  };

  return (
    <div
      className="bg-bg-2 shadow-1 rounded-3 flex w-full flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between"
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      <p className="sr-only">{srSummary}</p>
      <div className="flex w-full flex-col gap-2 md:w-[40%]">
        <div className="flex items-center gap-3">
          <h2 id={titleId} className="typo-h2-heading">
            {suite.title}
          </h2>
          <span
            className={`typo-label-heading rounded-full px-3 py-1 ${tagToneClass}`}
            aria-label={t('ui.tagAriaLabel', {
              label: tagLabel,
              tone: tagToneText(suite.tag.tone),
            })}
          >
            {tagLabel}
          </span>
          <DSButton variant="ghost" size="icon" onClick={handleEditClick}>
            <Edit className="h-3 w-3" />
          </DSButton>
        </div>
        <p id={descId} className="typo-body2-normal text-text-2">
          {descriptionText}
        </p>
      </div>
      <dl className="text-label-normal text-text-3 flex w-full flex-col gap-2 md:w-[30%]">
        <div className="flex items-center gap-1.5">
          <FolderTree aria-hidden="true" className="text-text-3 h-4 w-4" strokeWidth={1.5} />
          <dt className="sr-only">{t('ui.includedPaths')}</dt>
          <dd>{t('ui.pathLabel', { path: primaryPath })}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <FileText aria-hidden="true" className="text-text-3 h-4 w-4" strokeWidth={1.5} />
          <dt className="sr-only">{t('ui.testCases')}</dt>
          <dd>
            {t('ui.testCases')} {t('count.cases', { count: suite.caseCount })}
          </dd>
        </div>

        <div className="flex items-center gap-1.5">
          <Layers aria-hidden="true" className="text-text-3 h-4 w-4" strokeWidth={1.5} />
          <dt className="sr-only">{t('ui.milestoneTitle')}</dt>
          <dd>{t('ui.milestoneLabel', { milestone: milestoneText })}</dd>
        </div>
      </dl>
      <dl className="text-label-normal text-text-3 flex w-full flex-col gap-1 md:w-[30%] md:items-end">
        <div className="flex items-center gap-1.5 md:justify-end">
          <PlayCircle aria-hidden="true" className="text-text-3 h-4 w-4" strokeWidth={1.5} />
          <dt className="sr-only">{t('ui.lastRunDate')}</dt>
          <dd>{t('ui.lastRunDateLabel', { date: lastRunDateText })}</dd>
        </div>
        <div className="flex items-center gap-1.5 md:justify-end">
          <AlertCircle
            className={`${issueIconClass} h-4 w-4`}
            strokeWidth={1.5}
            aria-label={
              suite.lastRun ? (hasIssue ? t('ui.hasIssue') : t('ui.issueNone')) : t('ui.noLastRun')
            }
          />
          <dt className="sr-only">{t('ui.lastRunResultSr')}</dt>
          <dd>{issueText}</dd>
        </div>
        <div className="flex items-center gap-1.5 md:justify-end">
          <FileText aria-hidden="true" className="text-text-3 h-4 w-4" strokeWidth={1.5} />
          <dt className="sr-only">{t('ui.runHistory')}</dt>
          <dd>
            {t('ui.runHistoryLabel', {
              count: t('count.runs', { count: suite.executionHistoryCount }),
            })}
          </dd>
        </div>
        <div className="flex items-center gap-1.5 md:justify-end">
          <dt className="sr-only">마지막 실행 경과</dt>
          <dd>
            <LastRunFreshnessLabel lastExecutedAt={suite.lastExecutedAt} className="text-sm" />
          </dd>
        </div>
      </dl>
    </div>
  );
};
