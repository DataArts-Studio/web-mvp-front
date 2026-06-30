'use client';
import React, { useEffect, useMemo, useState } from 'react';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { projectIdQueryOptions } from '@/entities/project';
import type { TestSuiteCard } from '@/entities/test-suite';
import { SuiteCard } from '@/entities/test-suite/ui/suite-card';
import { SuiteCreateForm } from '@/features/suites-create';
import { SuiteEditForm } from '@/features/suites-edit';
import { TESTSUITE_EVENTS, track } from '@/shared/lib/analytics';
import { ActionToolbar, testSuitesQueryOptions } from '@/widgets';
import { useQuery } from '@tanstack/react-query';
import { useDisclosure } from '@testea/lib';
import { MainContainer } from '@testea/ui';
import { Pagination, ProjectErrorFallback, Skeleton } from '@testea/ui';

const FILTER_OPTIONS = ['all', 'feature', 'scenario'] as const;
type FilterOption = (typeof FILTER_OPTIONS)[number];
const PAGE_SIZE = 7;

export const TestSuitesView = () => {
  const params = useParams();
  const t = useTranslations('suites');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingSuite, setEditingSuite] = useState<TestSuiteCard | null>(null);

  const filterLabels: Record<FilterOption, string> = {
    all: t('ui.filterAll'),
    feature: t('ui.filterByFeature'),
    scenario: t('ui.filterByScenario'),
  };

  // 검색어, 필터, 페이지 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterOption>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // 클라이언트 hydration 완료 전까지 서버와 동일 출력(스켈레톤) 보장 → SSR↔CSR 미스매치 방지
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 마운트 후 hydration 완료 표시로 SSR↔CSR 미스매치 방지. mount-once 1회성이라 cascading render 비용 없음
    setHydrated(true);
  }, []);

  // slug → projectId를 가벼운 쿼리로 빠르게 획득 (워터폴 제거)
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

  // 필터링된 스위트 목록
  const filteredSuites = useMemo(() => {
    let result = suites;

    // 검색어 필터링
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(
        (suite) =>
          suite.title.toLowerCase().includes(query) ||
          suite.description?.toLowerCase().includes(query)
      );
    }

    // 출처 기반 필터링: 기능별 = 요구사항 분석서 파생, 시나리오 = 시나리오 파생
    if (filterType === 'feature') {
      result = result.filter((suite) => suite.requirementAnalysisId != null);
    } else if (filterType === 'scenario') {
      result = result.filter((suite) => suite.testScenarioId != null);
    }

    return result;
  }, [suites, searchQuery, filterType]);

  // 페이지네이션 계산
  const totalItems = filteredSuites.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  useEffect(() => {
    if (totalPages === 0) {
      if (currentPage !== 1) setCurrentPage(1);
      return;
    }
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handlePageChange = (page: number) => {
    const safePage = Math.min(Math.max(1, page), Math.max(1, totalPages));
    if (safePage === currentPage) return;
    setCurrentPage(safePage);
  };
  const paginatedSuites = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredSuites.slice(start, start + PAGE_SIZE);
  }, [filteredSuites, currentPage]);

  // 검색어 변경 핸들러
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // 필터 변경 핸들러 (표시 라벨 → 안정 키 역매핑)
  const handleFilterChange = (label: string) => {
    const matched = (Object.keys(filterLabels) as FilterOption[]).find(
      (key) => filterLabels[key] === label
    );
    setFilterType(matched ?? 'all');
    setCurrentPage(1);
  };

  const handleEdit = (suite: TestSuiteCard) => {
    setEditingSuite(suite);
  };

  const handleCloseEdit = () => {
    setEditingSuite(null);
  };

  // 테스트 스위트 목록 View 이벤트
  React.useEffect(() => {
    if (suiteData?.success) {
      track(TESTSUITE_EVENTS.LIST_VIEW, { project_id: projectId });
    }
  }, [suiteData?.success, projectId]);

  // 로딩 상태 — 스켈레톤 UI
  if (!hydrated || isLoadingProject || isLoadingSuites) {
    return (
      <MainContainer className="mx-auto grid min-h-screen w-full max-w-[1200px] flex-1 grid-cols-6 content-start gap-x-5 gap-y-8 px-10 py-8">
        {/* Header skeleton */}
        <header className="col-span-6 flex flex-col gap-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-96" />
        </header>
        {/* Toolbar skeleton */}
        <div className="col-span-6 flex items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-3">
            <Skeleton className="rounded-2 border-line-2 bg-bg-2 h-10 max-w-md flex-1 border" />
            <Skeleton className="rounded-2 border-line-2 bg-bg-2 h-10 w-28 border" />
          </div>
          <Skeleton className="rounded-2 h-9 w-44" />
        </div>
        {/* Suite card skeletons */}
        <section className="col-span-6 flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="bg-bg-2 shadow-1 rounded-3 flex w-full flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between"
            >
              {/* Left: title + tag + description */}
              <div className="flex w-full flex-col gap-2 md:w-[40%]">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full" />
              </div>
              {/* Middle: path, cases, milestone */}
              <div className="flex w-full flex-col gap-2 md:w-[30%]">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-40" />
              </div>
              {/* Right: run info */}
              <div className="flex w-full flex-col gap-1 md:w-[30%] md:items-end">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          ))}
        </section>
      </MainContainer>
    );
  }

  // 에러 상태
  if (!projectIdData?.success) return <ProjectErrorFallback />;

  return (
    <MainContainer className="mx-auto grid h-screen w-full max-w-[1200px] flex-1 grid-cols-6 grid-rows-[auto_auto_1fr] gap-x-5 gap-y-8 overflow-hidden px-10 py-8">
      {/* 헤더 영역 */}
      <header className="col-span-6 flex w-full items-start justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="typo-title-heading">{t('ui.pageTitle')}</h1>
          <p className="typo-body1-normal text-text-3">{t('ui.pageSubtitle')}</p>
        </div>
      </header>
      <ActionToolbar.Root ariaLabel={t('ui.controlsAriaLabel')}>
        <ActionToolbar.Group>
          <ActionToolbar.Search
            placeholder={t('ui.searchPlaceholder')}
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <ActionToolbar.Filter
            options={FILTER_OPTIONS.map((key) => filterLabels[key])}
            currentValue={filterLabels[filterType]}
            onChange={handleFilterChange}
          />
        </ActionToolbar.Group>
        <ActionToolbar.Action
          size="small"
          type="button"
          variant="solid"
          onClick={() => {
            track(TESTSUITE_EVENTS.CREATE_START, { project_id: projectId });
            onOpen();
          }}
        >
          {t('ui.createSuite')}
        </ActionToolbar.Action>
      </ActionToolbar.Root>
      <section aria-label={t('ui.listAriaLabel')} className="col-span-6 flex min-h-0 flex-col">
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
          {filteredSuites.length === 0 && (searchQuery || filterType !== 'all') ? (
            <div className="text-text-3 py-8 text-center">{t('ui.noResults')}</div>
          ) : null}
          {paginatedSuites.map((suite) => (
            <Link key={suite.id} href={`/projects/${params.slug}/suites/${suite.id}`}>
              <SuiteCard suite={suite} onEdit={() => handleEdit(suite)} />
            </Link>
          ))}
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </section>
      {isOpen && projectId && <SuiteCreateForm onClose={onClose} projectId={projectId} />}
      {editingSuite && <SuiteEditForm suite={editingSuite} onClose={handleCloseEdit} />}
    </MainContainer>
  );
};
