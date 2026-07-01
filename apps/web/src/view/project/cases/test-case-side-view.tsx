'use client';
import React, { useState } from 'react';

import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';

import { TestCase, parseSteps } from '@/entities/test-case';
import type { TestCaseListItem } from '@/entities/test-case/model/types';
import { ArchiveButton } from '@/features/archive/ui/archive-button';
import { TestCaseEditForm } from '@/features/cases-edit';
import { testCaseByIdQueryOptions } from '@/features/cases-list';
import { useVersionsList } from '@/features/version-timeline';
import { testSuitesQueryOptions } from '@/widgets';
import { useQuery } from '@tanstack/react-query';
import { DSButton } from '@testea/ui';
import { formatDateKR, formatRelativeTime } from '@testea/util';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Edit2,
  ExternalLink,
  Flag,
  FolderOpen,
  History,
  Tag,
  X,
} from 'lucide-react';

interface TestCaseSideViewProps {
  testCase?: TestCaseListItem;
  onClose: () => void;
}

type MetaItem = {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
};

export const TestCaseSideView = ({ testCase: listItem, onClose }: TestCaseSideViewProps) => {
  const t = useTranslations('cases');
  const { data: detailData, isLoading: isDetailLoading } = useQuery({
    ...testCaseByIdQueryOptions(listItem?.id ?? ''),
    enabled: !!listItem?.id,
  });
  const testCase = detailData?.success
    ? detailData.data
    : listItem
      ? ({ ...listItem, preCondition: '', testSteps: '', expectedResult: '' } as TestCase)
      : undefined;
  const isStepsLoading = !!listItem?.id && isDetailLoading;
  const router = useRouter();
  const params = useParams();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: suitesData } = useQuery({
    ...testSuitesQueryOptions(testCase?.projectId || ''),
    enabled: !!testCase?.projectId,
  });
  const suites = suitesData?.success ? suitesData.data : [];
  const currentSuite = suites.find((s) => s.id === testCase?.testSuiteId);

  const { data: versionsData } = useVersionsList(testCase?.id || '');
  const versions = versionsData?.success ? versionsData.data.versions : [];
  const latestVersion = versions[0];
  const versionCount = versionsData?.success ? versionsData.data.total : 0;

  const handleEdit = () => {
    setIsEditOpen(true);
  };

  const handleEditClose = () => {
    setIsEditOpen(false);
  };

  const metaItems: MetaItem[] = [
    {
      label: t('ui.testType'),
      value: testCase?.testType || t('ui.emptyValue'),
      icon: Flag,
    },
    {
      label: t('ui.suites'),
      value: currentSuite?.title || t('ui.noSuite'),
      icon: FolderOpen,
    },
    {
      label: t('ui.createdAt', { date: '' }),
      value: formatDateKR(testCase?.createdAt),
      icon: Calendar,
    },
    {
      label: t('ui.estimatedTime'),
      value: t('ui.emptyValue'),
      icon: Clock,
    },
  ];

  if (latestVersion) {
    metaItems.push({
      label: t('ui.versionHistory'),
      value: (
        <span className="flex items-center gap-1.5">
          <span>v{latestVersion.versionNumber}</span>
          {versionCount > 0 && <span className="text-text-4 text-xs">{versionCount}</span>}
        </span>
      ),
      icon: History,
    });
  }

  return (
    <>
      <motion.div
        role="button"
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16, ease: 'easeOut' }}
      />
      <motion.section
        className="bg-bg-1 border-line-2 fixed top-0 right-0 z-50 flex h-full w-[min(920px,calc(100vw-48px))] flex-col border-l shadow-[-16px_0_40px_rgba(15,23,42,0.12)]"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 420, damping: 38, mass: 0.9 }}
      >
        <header className="border-line-2 flex shrink-0 items-start justify-between gap-4 border-b px-5 py-4">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2 text-sm">
              <span className="text-primary font-semibold">
                {testCase?.caseKey || t('ui.defaultCaseKey')}
              </span>
              <span className="text-text-4">/</span>
              <span className="text-text-3 truncate">{currentSuite?.title || t('ui.noSuite')}</span>
            </div>
            <h2 className="text-text-1 line-clamp-2 text-xl leading-7 font-semibold">
              {testCase?.title || t('ui.defaultCaseTitle')}
            </h2>
            <div className="text-text-3 mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="flex items-center gap-1.5">
                <Flag className="h-3.5 w-3.5" />
                {testCase?.testType || t('ui.emptyValue')}
              </span>
              {latestVersion && (
                <span className="flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5" />
                  {t('ui.lastUpdated', { date: formatRelativeTime(latestVersion.createdAt) })}
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <DSButton
              size="small"
              variant="ghost"
              className="px-2"
              onClick={() => {
                if (testCase) {
                  router.push(`/projects/${params.slug}/cases/${testCase.id}`);
                }
              }}
              disabled={!testCase}
              title={t('ui.openDetailPage')}
            >
              <ExternalLink className="h-4 w-4" />
            </DSButton>

            <DSButton size="small" variant="ghost" className="px-2" onClick={onClose}>
              <X className="h-4 w-4" />
            </DSButton>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_280px]">
          <main className="min-w-0 overflow-y-auto px-5 py-4">
            <div className="flex flex-col gap-5">
              <ContentSection title={t('ui.preconditions')}>
                <SideStepsList
                  steps={testCase?.preCondition}
                  emptyText={t('ui.noPreconditions')}
                  isLoading={isStepsLoading}
                />
              </ContentSection>

              <ContentSection title={t('ui.testSteps')}>
                <SideStepsList
                  steps={testCase?.testSteps}
                  emptyText={t('ui.noTestSteps')}
                  isLoading={isStepsLoading}
                  ordered
                />
              </ContentSection>

              <ContentSection title={t('ui.expectedResults')}>
                <SideStepsList
                  steps={testCase?.expectedResult}
                  emptyText={t('ui.noExpectedResults')}
                  isLoading={isStepsLoading}
                />
              </ContentSection>
            </div>
          </main>

          <aside className="bg-bg-2/60 border-line-2 min-w-0 overflow-y-auto border-t px-4 py-4 lg:border-t-0 lg:border-l">
            <div className="flex flex-col gap-5">
              <section>
                <h3 className="text-text-4 mb-2 text-xs font-semibold tracking-[0.08em] uppercase">
                  {t('ui.details')}
                </h3>
                <dl className="border-line-2 divide-line-2 overflow-hidden border-y">
                  {metaItems.map((item) => (
                    <MetaRow key={item.label} item={item} />
                  ))}
                </dl>
              </section>

              <section>
                <h3 className="text-text-4 mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-[0.08em] uppercase">
                  <Tag className="h-3.5 w-3.5" />
                  {t('ui.tags')}
                </h3>
                {testCase?.tags && testCase.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {testCase.tags.map((tag, index) => (
                      <span
                        key={`${tag}-${index}`}
                        className="border-line-2 bg-bg-1 text-text-2 rounded-sm border px-2 py-1 text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-text-4 border-line-2 border-y py-3 text-sm">
                    {t('ui.noTags')}
                  </p>
                )}
              </section>
            </div>
          </aside>
        </div>

        <footer className="border-line-2 bg-bg-1 flex shrink-0 items-center justify-between gap-2 border-t px-5 py-3">
          <div className="text-text-4 min-w-0 truncate text-xs">
            {testCase?.id || t('ui.emptyValue')}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <DSButton
              size="small"
              variant="ghost"
              className="flex items-center gap-1.5 px-2"
              onClick={handleEdit}
              disabled={!testCase || isStepsLoading}
            >
              <Edit2 className="h-4 w-4" />
              <span>{t('ui.edit')}</span>
            </DSButton>
            {testCase && (
              <ArchiveButton
                targetType="case"
                targetId={testCase.id}
                btnType="icon"
                onSuccess={onClose}
              />
            )}
          </div>
        </footer>
      </motion.section>
      {isEditOpen && detailData?.success && (
        <TestCaseEditForm
          testCase={detailData.data}
          onClose={handleEditClose}
          onSuccess={handleEditClose}
        />
      )}
    </>
  );
};

function ContentSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-line-2 min-w-0 border-t pt-3">
      <h3 className="text-text-2 mb-2 text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function MetaRow({ item }: { item: MetaItem }) {
  const Icon = item.icon;

  return (
    <div className="grid grid-cols-[104px_minmax(0,1fr)] gap-3 py-3 text-sm">
      <dt className="text-text-4 flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        <span>{item.label}</span>
      </dt>
      <dd className="text-text-1 min-w-0 font-medium break-words">{item.value}</dd>
    </div>
  );
}

function SideStepsList({
  steps,
  emptyText = 'No items.',
  isLoading = false,
  ordered = false,
}: {
  steps?: string;
  emptyText?: string;
  isLoading?: boolean;
  ordered?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="py-2">
        <div className="flex flex-col gap-2">
          <div className="bg-bg-3 h-4 w-3/4 animate-pulse rounded" />
          <div className="bg-bg-3 h-4 w-1/2 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (!steps?.trim()) {
    return (
      <div className="py-2">
        <p className="text-text-4 text-sm whitespace-pre-wrap">{emptyText}</p>
      </div>
    );
  }

  const parsed = parseSteps(steps);
  const hasContent = parsed.some((s) => s.trim());

  if (!hasContent) {
    return (
      <div className="py-2">
        <p className="text-text-4 text-sm whitespace-pre-wrap">{emptyText}</p>
      </div>
    );
  }

  return (
    <ol className="divide-line-2 divide-y">
      {parsed.map((step, i) => (
        <li key={i} className="grid grid-cols-[32px_minmax(0,1fr)] gap-3 py-3 text-sm">
          <span className="text-text-4 font-mono text-xs leading-5">
            {ordered ? String(i + 1).padStart(2, '0') : '-'}
          </span>
          <p className="text-text-1 min-w-0 whitespace-pre-wrap">{step || '-'}</p>
        </li>
      ))}
    </ol>
  );
}
