'use client';

import React, { useState } from 'react';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { getTestTypeLabel, parseSteps } from '@/entities/test-case';
import { ArchiveButton } from '@/features/archive/ui/archive-button';
import { AttachmentSection } from '@/features/attachments';
import { TestCaseEditForm } from '@/features/cases-edit';
import { testCaseByIdQueryOptions } from '@/features/cases-list';
import { ExternalLinksSection } from '@/features/github-links';
import { VersionHistoryTab } from '@/features/version-timeline';
import { TESTCASE_EVENTS, track } from '@/shared/lib/analytics';
import { testSuitesQueryOptions } from '@/widgets';
import { useQuery } from '@tanstack/react-query';
import { DSButton, LoadingSpinner, MainContainer } from '@testea/ui';
import { formatDateTime } from '@testea/util';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit2,
  Flag,
  FolderOpen,
  History,
  Tag,
  XCircle,
} from 'lucide-react';

type DetailTab = 'details' | 'versions';

type MetaItem = {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
};

export const TestCaseDetailView = () => {
  const params = useParams();
  const t = useTranslations('cases');
  const router = useRouter();
  const caseId = params.caseId as string;
  const projectSlug = params.slug as string;
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>('details');

  const { data, isLoading, isError } = useQuery(testCaseByIdQueryOptions(caseId));

  const testCase = data?.success ? data.data : null;

  React.useEffect(() => {
    if (testCase) {
      track(TESTCASE_EVENTS.DETAIL_VIEW, { case_id: caseId });
    }
  }, [testCase, caseId]);

  const { data: suitesData } = useQuery({
    ...testSuitesQueryOptions(testCase?.projectId || ''),
    enabled: !!testCase?.projectId,
  });
  const suites = suitesData?.success ? suitesData.data : [];
  const currentSuite = suites.find((s) => s.id === testCase?.testSuiteId);

  if (isLoading) {
    return (
      <MainContainer className="flex flex-1 items-center justify-center">
        <LoadingSpinner size="lg" />
      </MainContainer>
    );
  }

  if (isError || !data?.success || !testCase) {
    return (
      <MainContainer className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <XCircle className="h-12 w-12 text-red-400" />
          <p className="text-text-1 font-semibold">{t('ui.loadDetailFailed')}</p>
          <Link href={`/projects/${projectSlug}/cases`} className="text-primary hover:underline">
            {t('ui.backToList')}
          </Link>
        </div>
      </MainContainer>
    );
  }

  const typeLabel = testCase.testType ? getTestTypeLabel(testCase.testType) : t('ui.emptyValue');
  const metaItems: MetaItem[] = [
    {
      label: t('ui.suites'),
      value: currentSuite?.title || t('ui.noSuite'),
      icon: FolderOpen,
    },
    {
      label: t('ui.testType'),
      value: typeLabel,
      icon: Flag,
    },
    {
      label: t('ui.createdAt', { date: '' }),
      value: formatDateTime(testCase.createdAt),
      icon: Calendar,
    },
    {
      label: t('ui.updatedAt', { date: '' }),
      value: formatDateTime(testCase.updatedAt),
      icon: Clock,
    },
  ];

  return (
    <MainContainer className="bg-bg-2/40 min-h-screen w-full flex-1 overflow-y-auto px-4 py-4">
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <Link
            href={`/projects/${projectSlug}/cases`}
            className="text-text-3 hover:text-text-1 flex w-fit items-center gap-1.5 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('ui.backToCaseList')}
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <DSButton
              size="small"
              variant="ghost"
              className="flex items-center gap-1.5"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="h-4 w-4" />
              {t('ui.edit')}
            </DSButton>
            <ArchiveButton
              targetType="case"
              targetId={testCase.id}
              onSuccess={() => router.push(`/projects/${projectSlug}/cases`)}
            />
          </div>
        </div>

        <header className="border-line-2 bg-bg-1 border px-4 py-3">
          <div className="mb-1.5 flex min-w-0 items-center gap-2 text-sm">
            <span className="text-primary font-semibold">{testCase.caseKey}</span>
            <span className="text-text-4">/</span>
            <span className="text-text-3 truncate">{currentSuite?.title || t('ui.noSuite')}</span>
          </div>
          <h1 className="text-text-1 text-xl leading-7 font-semibold">{testCase.title}</h1>
        </header>

        <nav className="border-line-2 bg-bg-1 flex border-x border-t">
          <TabButton active={activeTab === 'details'} onClick={() => setActiveTab('details')}>
            {t('ui.details')}
          </TabButton>
          <TabButton active={activeTab === 'versions'} onClick={() => setActiveTab('versions')}>
            <History className="h-4 w-4" />
            {t('ui.versionHistory')}
          </TabButton>
        </nav>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <main className="min-w-0">
            {activeTab === 'details' ? (
              <div className="flex flex-col gap-3">
                <ContentPanel title={t('ui.preconditions')}>
                  <StepsList steps={testCase.preCondition} emptyText={t('ui.noPreconditions')} />
                </ContentPanel>

                <ContentPanel title={t('ui.testSteps')}>
                  <StepsList steps={testCase.testSteps} emptyText={t('ui.noTestSteps')} ordered />
                </ContentPanel>

                <ContentPanel title={t('ui.expectedResults')}>
                  <StepsList
                    steps={testCase.expectedResult}
                    emptyText={t('ui.noExpectedResults')}
                  />
                </ContentPanel>

                <PlainPanel>
                  <AttachmentSection testCaseId={testCase.id} projectId={testCase.projectId} />
                </PlainPanel>

                <PlainPanel>
                  <ExternalLinksSection
                    testCaseId={testCase.id}
                    projectId={testCase.projectId}
                    testCaseName={testCase.title}
                    displayId={testCase.displayId}
                    resultStatus={testCase.resultStatus}
                  />
                </PlainPanel>
              </div>
            ) : (
              <div className="border-line-2 bg-bg-1 border px-4 py-3">
                <VersionHistoryTab testCaseId={testCase.id} />
              </div>
            )}
          </main>

          <aside className="min-w-0 lg:sticky lg:top-4 lg:self-start">
            <div className="border-line-2 bg-bg-1 border">
              <section>
                <h2 className="bg-bg-3 border-line-2 text-text-2 border-b px-3 py-2 text-xs font-semibold tracking-[0.08em] uppercase">
                  {t('ui.details')}
                </h2>
                <dl className="divide-line-2 divide-y">
                  {metaItems.map((item) => (
                    <MetaRow key={item.label} item={item} />
                  ))}
                </dl>
              </section>

              <section className="border-line-2 border-t">
                <h2 className="bg-bg-3 border-line-2 text-text-2 flex items-center gap-1.5 border-b px-3 py-2 text-xs font-semibold tracking-[0.08em] uppercase">
                  <Tag className="h-3.5 w-3.5" />
                  {t('ui.tags')}
                </h2>
                {testCase.tags && testCase.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 px-3 py-3">
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
                  <p className="text-text-4 px-3 py-3 text-sm">{t('ui.noTags')}</p>
                )}
              </section>
            </div>
          </aside>
        </div>
      </div>

      {isEditing && <TestCaseEditForm testCase={testCase} onClose={() => setIsEditing(false)} />}
    </MainContainer>
  );
};

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      className={`border-line-2 flex items-center gap-1.5 border-r px-4 py-2.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-bg-1 text-primary border-t-primary border-t-2'
          : 'bg-bg-2 text-text-3 hover:text-text-1'
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function ContentPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-line-2 bg-bg-1 border">
      <h2 className="bg-bg-3 border-line-2 text-text-2 border-b px-3 py-2 text-sm font-semibold">
        {title}
      </h2>
      <div className="px-3 py-1">{children}</div>
    </section>
  );
}

function PlainPanel({ children }: { children: React.ReactNode }) {
  return <div className="border-line-2 bg-bg-1 border px-3 py-3">{children}</div>;
}

function MetaRow({ item }: { item: MetaItem }) {
  const Icon = item.icon;

  return (
    <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3 px-3 py-2.5 text-sm">
      <dt className="text-text-4 flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />}
        <span>{item.label}</span>
      </dt>
      <dd className="text-text-1 min-w-0 font-medium break-words">{item.value}</dd>
    </div>
  );
}

function StepsList({
  steps,
  emptyText = 'No items.',
  ordered = false,
}: {
  steps: string;
  emptyText?: string;
  ordered?: boolean;
}) {
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
        <li key={i} className="grid grid-cols-[32px_minmax(0,1fr)] gap-3 py-2.5 text-sm">
          <span className="text-text-4 font-mono text-xs leading-5">
            {ordered ? String(i + 1).padStart(2, '0') : '-'}
          </span>
          <p className="text-text-1 min-w-0 whitespace-pre-wrap">{step || '-'}</p>
        </li>
      ))}
    </ol>
  );
}
