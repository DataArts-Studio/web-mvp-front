'use client';

import React from 'react';

import { useTranslations } from 'next-intl';
import Link from 'next/link';

import type { TestSuiteCard } from '@/entities/test-suite';
import { ArchiveButton } from '@/features/archive/ui/archive-button';
import { cn } from '@testea/util';
import { CheckCircle2, ChevronLeft, Circle, Play, XCircle } from 'lucide-react';

import { TAG_TONE_CONFIG } from './suite-detail-constants';
import { suiteHealthOf } from './suite-list-model';

interface SuiteDetailHeaderProps {
  suite: TestSuiteCard;
  projectSlug: string;
  onEdit: () => void;
  onArchived: () => void;
}

const TAG_LABEL_KEY: Record<string, string> = {
  neutral: 'ui.tagNeutral',
  info: 'ui.tagInfo',
  success: 'ui.tagSuccess',
  warning: 'ui.tagWarning',
  danger: 'ui.tagDanger',
};

export const SuiteDetailHeader = ({
  suite,
  projectSlug,
  onEdit,
  onArchived,
}: SuiteDetailHeaderProps) => {
  const t = useTranslations('suites');
  const health = suiteHealthOf(suite);
  const statusLabel = t(
    health === 'issue'
      ? 'detail.statusIssue'
      : health === 'ok'
        ? 'detail.statusOk'
        : 'detail.statusNone'
  );
  const tone = suite.tag?.tone ?? 'neutral';
  // 실행은 마일스톤 단위로 만든다. 연결된 마일스톤이 있으면 미리 골라 둔다.
  const createRunHref = suite.linkedMilestone
    ? `/projects/${projectSlug}/runs/create?milestoneId=${suite.linkedMilestone.id}`
    : `/projects/${projectSlug}/runs/create`;

  return (
    <header className="flex flex-col gap-2">
      <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-[12px] text-white/40">
        <Link
          href={`/projects/${projectSlug}/suites`}
          className="inline-flex items-center gap-0.5 hover:text-white/70"
        >
          <ChevronLeft className="h-3 w-3" aria-hidden="true" />
          {t('detail.breadcrumb')}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="truncate text-white/60">{suite.title}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex shrink-0" title={statusLabel}>
              {health === 'issue' ? (
                <XCircle className="text-result-fail h-[18px] w-[18px]" aria-hidden="true" />
              ) : health === 'ok' ? (
                <CheckCircle2 className="text-result-pass h-[18px] w-[18px]" aria-hidden="true" />
              ) : (
                <Circle
                  className="h-[18px] w-[18px] text-white/30"
                  strokeDasharray="3 3"
                  aria-hidden="true"
                />
              )}
              <span className="sr-only">{statusLabel}</span>
            </span>
            <h1 className="truncate text-[22px] font-bold tracking-[-0.02em] text-white">
              {suite.title}
            </h1>
            {suite.tag && (
              <span
                className={cn(
                  'shrink-0 rounded-[4px] px-1.5 py-0.5 text-[11px]',
                  TAG_TONE_CONFIG[tone]?.style ?? TAG_TONE_CONFIG.neutral.style
                )}
              >
                {t(TAG_LABEL_KEY[tone] ?? 'ui.tagNeutral')}
              </span>
            )}
          </div>
          <p className="text-[13px] text-white/55">{suite.description || t('ui.noDescription')}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="border-line-2 h-9 rounded-[6px] border px-3.5 text-[13px] text-white/85 hover:bg-white/[0.04]"
          >
            {t('ui.edit')}
          </button>
          <ArchiveButton
            targetType="suite"
            targetId={suite.id}
            btnType="icon"
            onSuccess={onArchived}
          />
          <Link
            href={createRunHref}
            className="bg-primary hover:bg-primary/90 inline-flex h-9 items-center gap-1.5 rounded-[6px] px-3.5 text-[13px] font-medium text-white"
          >
            <Play className="h-3.5 w-3.5" aria-hidden="true" />
            {t('detail.createRun')}
          </Link>
        </div>
      </div>
    </header>
  );
};
