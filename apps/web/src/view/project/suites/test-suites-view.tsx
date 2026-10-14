'use client';
import React, { useEffect, useMemo, useState } from 'react';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

import { projectIdQueryOptions } from '@/entities/project';
import type { TestSuiteCard } from '@/entities/test-suite';
import { SuiteCreateForm } from '@/features/suites-create';
import { SuiteEditForm } from '@/features/suites-edit';
import { TESTSUITE_EVENTS, track } from '@/shared/lib/analytics';
import { testSuitesQueryOptions } from '@/widgets';
import { useQuery } from '@tanstack/react-query';
import { useDisclosure } from '@testea/lib';
import { MainContainer, ProjectErrorFallback, Skeleton } from '@testea/ui';
import { cn } from '@testea/util';
import { ArrowUpDown, Plus, Search } from 'lucide-react';

import {
  HISTORY_SLOTS,
  type SuiteListTab,
  type SuiteSort,
  sortSuites,
  suiteHealthOf,
} from './_components/suite-list-model';
import { SUITE_ROW_GRID, SuiteListRow } from './_components/suite-list-row';

const TABS: { value: SuiteListTab; label: 'tabAll' | 'tabIssue' | 'tabOk' | 'tabNone' }[] = [
  { value: 'all', label: 'tabAll' },
  { value: 'issue', label: 'tabIssue' },
  { value: 'ok', label: 'tabOk' },
  { value: 'none', label: 'tabNone' },
];

export const TestSuitesView = () => {
  const params = useParams();
  const t = useTranslations('suites');
  const tl = useTranslations('suites.list');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingSuite, setEditingSuite] = useState<TestSuiteCard | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SuiteListTab>('all');
  const [sort, setSort] = useState<SuiteSort>('recent');

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 마운트 후 hydration 완료 표시로 SSR↔CSR 미스매치 방지. mount-once 1회성이라 cascading render 비용 없음
    setHydrated(true);
  }, []);

  const { data: projectIdData, isLoading: isLoadingProject } = useQuery(
    projectIdQueryOptions(params.slug as string)
  );
  const projectId = projectIdData?.success ? projectIdData.data.id : undefined;

  const { data: suiteData, isLoading: isLoadingSuites } = useQuery({
    ...testSuitesQueryOptions(projectId!),
    enabled: !!projectId,
  });
  const suites: TestSuiteCard[] = useMemo(
    () => (suiteData?.success ? suiteData.data : []),
    [suiteData]
  );

  const filteredSuites = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return suites;
    return suites.filter(
      (suite) =>
        suite.title.toLowerCase().includes(query) ||
        suite.description?.toLowerCase().includes(query)
    );
  }, [suites, searchQuery]);

  const tabCounts = useMemo(() => {
    const counts: Record<SuiteListTab, number> = {
      all: filteredSuites.length,
      issue: 0,
      ok: 0,
      none: 0,
    };
    for (const suite of filteredSuites) counts[suiteHealthOf(suite)] += 1;
    return counts;
  }, [filteredSuites]);

  const visibleSuites = useMemo(
    () =>
      sortSuites(
        activeTab === 'all'
          ? filteredSuites
          : filteredSuites.filter((suite) => suiteHealthOf(suite) === activeTab),
        sort
      ),
    [filteredSuites, activeTab, sort]
  );

  React.useEffect(() => {
    if (suiteData?.success) {
      track(TESTSUITE_EVENTS.LIST_VIEW, { project_id: projectId });
    }
  }, [suiteData?.success, projectId]);

  if (!hydrated || isLoadingProject || isLoadingSuites) {
    return (
      <MainContainer className="flex h-screen w-full flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between gap-4 px-4 py-5 md:px-8">
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-[350px] max-w-[50%]" />
        </header>
        <div className="border-line-2 flex gap-3 border-b px-4 pb-2.5 md:px-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-20" />
          ))}
        </div>
        <div className="flex flex-col px-4 pt-4 md:px-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border-line-2 flex items-center gap-4 border-b px-2.5 py-4">
              <Skeleton className="h-4 w-4 rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-72 max-w-full" />
              </div>
              <Skeleton className="hidden h-6 w-[270px] lg:block" />
              <Skeleton className="h-5 w-12" />
            </div>
          ))}
        </div>
      </MainContainer>
    );
  }

  if (!projectIdData?.success) return <ProjectErrorFallback />;

  const isSearching = searchQuery.trim() !== '';
  const totalCases = suites.reduce((sum, suite) => sum + suite.caseCount, 0);

  return (
    <MainContainer className="flex h-screen w-full flex-1 flex-col overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-4 px-4 py-5 md:px-8">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-[20px] font-bold tracking-[-0.02em] text-white">{tl('title')}</h1>
          <p className="text-[13px] tracking-[-0.02em] text-white/40">{tl('subtitle')}</p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <label className="border-line-2 bg-bg-2 focus-within:border-primary/60 flex h-9 min-w-0 flex-1 items-center gap-2 rounded-[6px] border px-3 sm:w-[240px] sm:flex-none">
            <span className="sr-only">{tl('searchPlaceholder')}</span>
            <Search className="h-3.5 w-3.5 shrink-0 text-white/40" aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={tl('searchPlaceholder')}
              className="min-w-0 flex-1 bg-transparent text-[13px] text-white/90 outline-none placeholder:text-white/40"
            />
          </label>
          <button
            type="button"
            onClick={() => {
              track(TESTSUITE_EVENTS.CREATE_START, { project_id: projectId });
              onOpen();
            }}
            className="bg-primary hover:bg-primary/90 inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[4px] px-3.5 text-[14px] font-medium whitespace-nowrap text-white"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            {tl('create')}
          </button>
        </div>
      </header>

      <div className="border-line-2 flex flex-wrap items-center justify-between gap-2 border-b px-4 md:px-8">
        <div role="tablist" aria-label={tl('tabsLabel')} className="flex flex-wrap gap-1">
          {TABS.map((tab) => {
            const active = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  '-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-[14px] whitespace-nowrap',
                  active
                    ? 'border-primary font-bold text-white'
                    : 'border-transparent font-medium text-white/40 hover:text-white/70'
                )}
              >
                {tl(tab.label)}
                <span
                  className={cn(
                    'rounded-[4px] px-2 py-0.5 text-[11px] font-medium',
                    active ? 'bg-primary/15 text-primary' : 'bg-white/[0.06] text-white'
                  )}
                >
                  {tabCounts[tab.value]}
                </span>
              </button>
            );
          })}
        </div>
        <label className="flex items-center gap-1.5 py-2 text-[13px] text-white/70">
          <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sr-only">{tl('sortLabel')}</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SuiteSort)}
            className="bg-bg-1 cursor-pointer text-[13px] text-white/70 outline-none"
          >
            <option value="recent">{tl('sortRecent')}</option>
            <option value="name">{tl('sortName')}</option>
            <option value="passRate">{tl('sortPassRate')}</option>
          </select>
        </label>
      </div>

      <section
        aria-label={t('ui.listAriaLabel')}
        className="min-h-0 flex-1 overflow-y-auto px-4 pt-2 pb-8 md:px-8"
      >
        {visibleSuites.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-2 px-6 text-center">
            <p className="typo-body2-heading text-text-1">
              {suites.length === 0 || isSearching ? t('ui.noResults') : tl('emptyTab')}
            </p>
            {(suites.length === 0 || isSearching) && (
              <p className="typo-body2-normal text-text-3 max-w-md">
                {isSearching ? t('ui.noResultsHelp') : t('ui.noSuitesHelp')}
              </p>
            )}
          </div>
        ) : (
          <>
            <div
              aria-hidden="true"
              className={cn(
                'hidden px-2.5 py-2.5 text-[11px] text-white/40 lg:grid',
                SUITE_ROW_GRID
              )}
            >
              <span />
              <span>{tl('colSuite')}</span>
              <span>
                {tl('colHistory', { count: HISTORY_SLOTS })}
                <span className="ml-2 text-white/25">{tl('colHistoryHint')}</span>
              </span>
              <span>{tl('colMilestone')}</span>
              <span className="text-right">{tl('colRate')}</span>
            </div>
            <ul>
              {visibleSuites.map((suite) => (
                <SuiteListRow
                  key={suite.id}
                  suite={suite}
                  href={`/projects/${params.slug}/suites/${suite.id}`}
                  projectSlug={params.slug as string}
                  onEdit={() => setEditingSuite(suite)}
                />
              ))}
            </ul>
            <p className="px-2.5 pt-3.5 text-[11px] text-white/35">
              {tl('footer', { suites: suites.length, cases: totalCases })}
            </p>
          </>
        )}
      </section>
      {isOpen && projectId && <SuiteCreateForm onClose={onClose} projectId={projectId} />}
      {editingSuite && <SuiteEditForm suite={editingSuite} onClose={() => setEditingSuite(null)} />}
    </MainContainer>
  );
};
