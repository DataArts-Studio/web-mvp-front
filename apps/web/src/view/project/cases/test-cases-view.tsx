'use client';

import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

import { TestCaseCardType } from '@/entities/test-case';
import { projectIdQueryOptions } from '@/entities/project';
import { testSuitesQueryOptions } from '@/entities/test-suite';
import { TestCaseDetailForm } from '@/features/cases-create';
import { testCasesQueryOptions } from '@/features/cases-list';
import { MainContainer } from '@/shared/lib/primitives';
import { useDisclosure } from '@/shared/hooks';
import { track, TESTCASE_EVENTS } from '@/shared/lib/analytics';
import { exportTestCasesToCSV } from '@/features/cases-export';
import { ImportWizardModal } from '@/features/import-cases';
import { AiGenerateModal } from '@/features/ai-generate';
import { ProjectErrorFallback } from '@/shared/ui';

import { CasesToolbar, type SortValue } from './_components/cases-toolbar';
import { SuiteSidebar } from './_components/suite-sidebar';
import { CaseListSection } from './_components/case-list-section';
import { CasesLoadingSkeleton } from './_components/cases-loading-skeleton';

const TestCaseSideView = dynamic(
  () => import('@/view/project/cases/test-case-side-view').then(mod => ({ default: mod.TestCaseSideView })),
  { ssr: false },
);
const AnimatePresence = dynamic(
  () => import('framer-motion').then(mod => ({ default: mod.AnimatePresence })),
  { ssr: false },
);

const PAGE_SIZE = 15;

type ModalType = 'create' | 'detail' | 'import' | 'ai-generate';

export const TestCasesView = () => {
  const params = useParams();
  const listRef = useRef<HTMLDivElement>(null);
  const { onClose, onOpen, isActiveType } = useDisclosure<ModalType>();
  const [selectedTestCaseId, setSelectedTestCaseId] = useState<string | null>(null);

  // 검색 및 필터 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortOption, setSortOption] = useState<SortValue>('custom');
  const [selectedSuiteId, setSelectedSuiteId] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const slug = params.slug as string;

  // 검색어 debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSuiteChange = useCallback((id: string) => {
    setSelectedSuiteId(id);
    setCurrentPage(1);
  }, []);

  const handleSortChange = useCallback((value: string) => {
    track(TESTCASE_EVENTS.SORT_CHANGE, { sort: value });
    setSortOption(value as SortValue);
    setCurrentPage(1);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (value.trim()) {
      track(TESTCASE_EVENTS.SEARCH, { keyword: value.trim() });
    }
  }, []);

  // Data fetching
  const { data: projectIdData, isLoading: isLoadingProject } = useQuery(projectIdQueryOptions(slug));
  const projectId = projectIdData?.success ? projectIdData.data.id : undefined;

  const queryParams = useMemo(() => ({
    page: currentPage,
    size: PAGE_SIZE,
    sort: sortOption,
    search: debouncedSearch || undefined,
    suiteId: selectedSuiteId !== 'all' ? selectedSuiteId : undefined,
  }), [currentPage, sortOption, debouncedSearch, selectedSuiteId]);

  const { data: testCasesData, isLoading: isLoadingCases, isFetching } = useQuery({
    ...testCasesQueryOptions(projectId!, queryParams),
    enabled: !!projectId,
    placeholderData: (prev) => prev,
  });

  const { data: suitesData } = useQuery({
    ...testSuitesQueryOptions(projectId!),
    enabled: !!projectId,
  });

  const suites = useMemo(() => {
    if (!suitesData?.success) return [];
    return suitesData.data;
  }, [suitesData]);

  const suiteMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const suite of suites) map.set(suite.id, suite.title);
    return map;
  }, [suites]);

  const testCaseItems: TestCaseCardType[] = testCasesData?.success
    ? testCasesData.data.items.map((item) => ({
        ...item,
        suiteTitle: item.testSuiteId ? (suiteMap.get(item.testSuiteId) || '') : '',
        status: item.resultStatus,
        lastExecutedAt: null,
      }))
    : [];

  const pagination = testCasesData?.success ? testCasesData.data.pagination : null;

  // Analytics
  useEffect(() => {
    if (testCasesData?.success) {
      track(TESTCASE_EVENTS.LIST_VIEW, { project_id: projectId });
    }
  }, [testCasesData?.success, projectId]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    listRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    handleSuiteChange('all');
  }, [handleSuiteChange]);

  // 타이틀 결정
  const title = selectedSuiteId === 'all'
    ? '테스트 케이스'
    : selectedSuiteId === '__uncategorized__'
      ? '미분류'
      : suiteMap.get(selectedSuiteId) || '테스트 케이스';

  // Loading
  if (isLoadingProject || (isLoadingCases && !testCasesData)) {
    return <CasesLoadingSkeleton />;
  }

  if (!projectIdData?.success) return <ProjectErrorFallback />;

  return (
    <>
      <MainContainer className="flex min-h-screen w-full flex-1 overflow-hidden">
        <SuiteSidebar
          suites={suites}
          selectedSuiteId={selectedSuiteId}
          totalItems={pagination?.totalItems}
          onSuiteChange={handleSuiteChange}
        />

        <div ref={listRef} className="flex h-screen w-full flex-1 flex-col overflow-y-auto">
          <CasesToolbar
            title={title}
            totalItems={pagination?.totalItems}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            sortOption={sortOption}
            onSortChange={handleSortChange}
            onCreateClick={() => {
              track(TESTCASE_EVENTS.CREATE_START, { project_id: projectId });
              onOpen('create');
            }}
            onAiGenerate={() => onOpen('ai-generate')}
            onImport={() => {
              track(TESTCASE_EVENTS.IMPORT_START, { project_id: projectId });
              onOpen('import');
            }}
            onExport={() => {
              track(TESTCASE_EVENTS.EXPORT, { project_id: projectId, count: testCaseItems.length });
              exportTestCasesToCSV(testCaseItems, decodeURIComponent(slug));
            }}
          />

          <CaseListSection
            projectId={projectId!}
            slug={slug}
            items={testCaseItems}
            sortOption={sortOption}
            selectedSuiteId={selectedSuiteId}
            isFetching={isFetching}
            hasData={!!testCasesData}
            debouncedSearch={debouncedSearch}
            pagination={pagination}
            queryParams={queryParams}
            onPageChange={handlePageChange}
            onResetFilters={handleResetFilters}
            onSelectCase={(id) => {
              track(TESTCASE_EVENTS.ITEM_CLICK, { case_id: id });
              setSelectedTestCaseId(id);
              onOpen('detail');
            }}
          />
        </div>
      </MainContainer>

      {isActiveType('create') && (
        <TestCaseDetailForm
          projectId={projectId!}
          onClose={onClose}
          defaultSuiteId={
            selectedSuiteId !== 'all' && selectedSuiteId !== '__uncategorized__'
              ? selectedSuiteId
              : undefined
          }
        />
      )}
      {isActiveType('import') && <ImportWizardModal projectId={projectId!} onClose={onClose} />}
      {isActiveType('ai-generate') && projectId && (
        <AiGenerateModal projectId={projectId} slug={slug} onClose={onClose} />
      )}
      <AnimatePresence>
        {isActiveType('detail') && selectedTestCaseId && (
          <TestCaseSideView
            testCase={testCaseItems.find(tc => tc.id === selectedTestCaseId)}
            onClose={() => {
              setSelectedTestCaseId(null);
              onClose();
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
};
