'use client';
import React, { useEffect, useMemo, useState } from 'react';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

import { projectIdQueryOptions } from '@/entities/project';
import type { TestSuiteCard } from '@/entities/test-suite';
import { SuiteCard } from '@/entities/test-suite/ui/suite-card';
import { SuiteCreateForm } from '@/features/suites-create';
import { SuiteEditForm } from '@/features/suites-edit';
import { TESTSUITE_EVENTS, track } from '@/shared/lib/analytics';
import { testSuitesQueryOptions } from '@/widgets';
import { useQuery } from '@tanstack/react-query';
import { useDisclosure } from '@testea/lib';
import { MainContainer, Pagination, ProjectErrorFallback, Skeleton } from '@testea/ui';
import { Plus, Search } from 'lucide-react';

const PAGE_SIZE = 7;

export const TestSuitesView = () => {
  const params = useParams();
  const t = useTranslations('suites');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingSuite, setEditingSuite] = useState<TestSuiteCard | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

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
    let result = suites;

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(
        (suite) =>
          suite.title.toLowerCase().includes(query) ||
          suite.description?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [suites, searchQuery]);

  const totalItems = filteredSuites.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  const paginatedSuites = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredSuites.slice(start, start + PAGE_SIZE);
  }, [filteredSuites, currentPage]);

  useEffect(() => {
    if (totalPages === 0) {
      if (currentPage !== 1) setCurrentPage(1);
      return;
    }

    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (totalPages === 0) {
      setCurrentPage(1);
      return;
    }

    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
  };

  const handleEdit = (suite: TestSuiteCard) => {
    setEditingSuite(suite);
  };

  const handleCloseEdit = () => {
    setEditingSuite(null);
  };

  React.useEffect(() => {
    if (suiteData?.success) {
      track(TESTSUITE_EVENTS.LIST_VIEW, { project_id: projectId });
    }
  }, [suiteData?.success, projectId]);

  if (!hydrated || isLoadingProject || isLoadingSuites) {
    return (
      <MainContainer className="mx-auto grid min-h-screen w-full max-w-[1200px] flex-1 grid-cols-6 content-start gap-x-5 gap-y-6 px-10 py-8">
        <header className="col-span-6 flex flex-col gap-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-96" />
        </header>
        <div className="col-span-6 flex items-center justify-between gap-4">
          <Skeleton className="rounded-1 h-10 max-w-lg flex-1" />
          <Skeleton className="rounded-1 h-10 w-40" />
        </div>
        <section className="col-span-6 flex min-h-[520px] flex-col overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="border-line-2 grid grid-cols-1 gap-3 border-b px-1 py-4 md:grid-cols-[minmax(0,1fr)_220px] md:gap-6"
            >
              <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-72" />
                <Skeleton className="h-4 w-96 max-w-full" />
                <Skeleton className="h-4 w-56" />
              </div>
              <div className="flex flex-col gap-2 md:items-end">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))}
        </section>
      </MainContainer>
    );
  }

  if (!projectIdData?.success) return <ProjectErrorFallback />;

  return (
    <MainContainer className="mx-auto grid h-screen w-full max-w-[1200px] flex-1 grid-cols-6 grid-rows-[auto_1fr] gap-x-5 gap-y-5 overflow-hidden px-10 py-8">
      <header className="col-span-6 flex w-full items-start justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="typo-title-heading">{t('ui.pageTitle')}</h1>
          <p className="typo-body1-normal text-text-3 max-w-3xl">{t('ui.pageSubtitle')}</p>
        </div>
      </header>

      <section
        aria-label={t('ui.listAriaLabel')}
        className="col-span-6 flex min-h-0 flex-col overflow-hidden"
      >
        <div className="border-line-2 flex flex-col gap-3 border-b pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h2 className="typo-body2-heading text-text-1">{t('ui.listAriaLabel')}</h2>
            <p className="typo-caption-normal text-text-4">
              {totalItems} / {suites.length}
              {searchQuery.trim() ? ` · "${searchQuery.trim()}"` : ''}
            </p>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2 lg:max-w-2xl lg:flex-row lg:items-center lg:justify-end">
            <label className="relative min-w-0 flex-1 lg:max-w-md">
              <span className="sr-only">{t('ui.searchPlaceholder')}</span>
              <Search
                aria-hidden="true"
                className="text-text-4 pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                strokeWidth={1.8}
              />
              <input
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder={t('ui.searchPlaceholder')}
                className="typo-body2-normal border-line-2 bg-bg-2 text-text-1 placeholder:text-text-4 focus:border-primary focus:ring-primary h-9 w-full border pr-3 pl-9 transition-colors outline-none focus:ring-1"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                track(TESTSUITE_EVENTS.CREATE_START, { project_id: projectId });
                onOpen();
              }}
              className="typo-body2-heading bg-primary hover:bg-primary/90 inline-flex h-9 shrink-0 items-center justify-center gap-2 px-3 text-white transition-colors"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t('ui.createSuite')}
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="flex flex-col">
                {filteredSuites.length === 0 ? (
                  <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-2 px-6 text-center">
                    <p className="typo-body2-heading text-text-1">{t('ui.noResults')}</p>
                    <p className="typo-body2-normal text-text-3 max-w-md">
                      {searchQuery.trim() ? t('ui.noResultsHelp') : t('ui.noSuitesHelp')}
                    </p>
                  </div>
                ) : (
                  paginatedSuites.map((suite) => (
                    <SuiteCard
                      key={suite.id}
                      href={`/projects/${params.slug}/suites/${suite.id}`}
                      suite={suite}
                      onEdit={() => handleEdit(suite)}
                    />
                  ))
                )}
              </div>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              className="border-line-2 border-t"
            />
          </div>
        </div>
      </section>
      {isOpen && projectId && <SuiteCreateForm onClose={onClose} projectId={projectId} />}
      {editingSuite && <SuiteEditForm suite={editingSuite} onClose={handleCloseEdit} />}
    </MainContainer>
  );
};
