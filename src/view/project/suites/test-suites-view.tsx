'use client';
import React, { useState, useMemo } from 'react';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { SuiteCard } from '@/entities/test-suite/ui/suite-card';
import type { TestSuiteCard } from '@/entities/test-suite';
import { projectIdQueryOptions } from '@/entities/project';
import { dashboardQueryOptions } from '@/features/dashboard';
import { SuiteEditForm } from '@/features/suites-edit';
import { SuiteCreateForm } from '@/features/suites-create';
import { MainContainer } from '@/shared/lib/primitives';
import { useDisclosure } from '@/shared/hooks';
import { ActionToolbar, testSuitesQueryOptions } from '@/widgets';
import { useQuery } from '@tanstack/react-query';
import { track, TESTSUITE_EVENTS } from '@/shared/lib/analytics';

const FILTER_OPTIONS = ['전체', '기능별', '시나리오'] as const;
type FilterOption = typeof FILTER_OPTIONS[number];

export const TestSuitesView = () => {
  const params = useParams();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingSuite, setEditingSuite] = useState<TestSuiteCard | null>(null);

  // 검색어 및 필터 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterOption>('전체');

  // slug → projectId를 가벼운 쿼리로 빠르게 획득 (워터폴 제거)
  const { data: projectIdData } = useQuery(projectIdQueryOptions(params.slug as string));
  const projectId = projectIdData?.success ? projectIdData.data.id : undefined;

  const { data: dashboardData, isLoading: isLoadingProject } = useQuery(dashboardQueryOptions.stats(params.slug as string));

  const { data: suiteData, isLoading: isLoadingSuites } = useQuery({
    ...testSuitesQueryOptions(projectId!),
    enabled: !!projectId,
  });
  const suites: TestSuiteCard[] = suiteData?.success ? suiteData.data : [];

  // 필터링된 스위트 목록
  const filteredSuites = useMemo(() => {
    let result = suites;

    // 검색어 필터링
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter((suite) =>
        suite.title.toLowerCase().includes(query) ||
        suite.description?.toLowerCase().includes(query)
      );
    }

    // 타입 필터링 (향후 tag 기반 필터링 확장 가능)
    if (filterType !== '전체') {
      result = result.filter((suite) => suite.tag.label === filterType);
    }

    return result;
  }, [suites, searchQuery, filterType]);

  // 검색어 변경 핸들러
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // 필터 변경 핸들러
  const handleFilterChange = (value: string) => {
    setFilterType(value as FilterOption);
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
  if (isLoadingProject || isLoadingSuites) {
    return (
      <MainContainer className="mx-auto grid min-h-screen w-full max-w-[1200px] flex-1 grid-cols-6 content-start gap-x-5 gap-y-8 px-10 py-8">
        {/* Header skeleton */}
        <header className="col-span-6 flex flex-col gap-2">
          <div className="h-8 w-64 animate-pulse rounded bg-bg-3" />
          <div className="h-5 w-96 animate-pulse rounded bg-bg-3" />
        </header>
        {/* Toolbar skeleton */}
        <div className="col-span-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="h-10 flex-1 max-w-md animate-pulse rounded-2 border border-line-2 bg-bg-2" />
            <div className="h-10 w-28 animate-pulse rounded-2 border border-line-2 bg-bg-2" />
          </div>
          <div className="h-9 w-44 animate-pulse rounded-2 bg-bg-3" />
        </div>
        {/* Suite card skeletons */}
        <section className="col-span-6 flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-bg-2 shadow-1 rounded-3 flex w-full flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between">
              {/* Left: title + tag + description */}
              <div className="flex w-full flex-col gap-2 md:w-[40%]">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-40 animate-pulse rounded bg-bg-3" />
                  <div className="h-6 w-16 animate-pulse rounded-full bg-bg-3" />
                </div>
                <div className="h-4 w-full animate-pulse rounded bg-bg-3" />
              </div>
              {/* Middle: path, cases, milestone */}
              <div className="flex w-full flex-col gap-2 md:w-[30%]">
                <div className="h-4 w-36 animate-pulse rounded bg-bg-3" />
                <div className="h-4 w-32 animate-pulse rounded bg-bg-3" />
                <div className="h-4 w-40 animate-pulse rounded bg-bg-3" />
              </div>
              {/* Right: run info */}
              <div className="flex w-full flex-col gap-1 md:w-[30%] md:items-end">
                <div className="h-4 w-32 animate-pulse rounded bg-bg-3" />
                <div className="h-4 w-36 animate-pulse rounded bg-bg-3" />
                <div className="h-4 w-28 animate-pulse rounded bg-bg-3" />
              </div>
            </div>
          ))}
        </section>
      </MainContainer>
    );
  }

  // 에러 상태
  if (!dashboardData?.success) {
    return (
      <MainContainer className="flex flex-1 items-center justify-center">
        <div className="text-red-400">프로젝트를 불러올 수 없습니다.</div>
      </MainContainer>
    );
  }

  return (
    <MainContainer className="mx-auto grid min-h-screen w-full max-w-[1200px] flex-1 grid-cols-6 content-start gap-x-5 gap-y-8 px-10 py-8">
        {/* 헤더 영역 */}
        <header className="col-span-6 flex w-full items-start justify-between gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="typo-title-heading">테스트 스위트 관리</h1>
            <p className="typo-body1-normal text-text-3">
              흩어진 테스트 케이스를 기능·시나리오 단위 스위트로 묶어 관리하고, 문서 복사 없이 같은
              스위트를 반복 실행하세요.
            </p>
          </div>
        </header>
        <ActionToolbar.Root ariaLabel="테스트 스위트 컨트롤">
          <ActionToolbar.Group>
            <ActionToolbar.Search
              placeholder="스위트 이름 또는 키워드로 검색"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <ActionToolbar.Filter
              options={[...FILTER_OPTIONS]}
              currentValue={filterType}
              onChange={handleFilterChange}
            />
          </ActionToolbar.Group>
          <ActionToolbar.Action size="small" type="button" variant="solid" onClick={() => { track(TESTSUITE_EVENTS.CREATE_START, { project_id: projectId }); onOpen(); }}>
            테스트 스위트 생성하기
          </ActionToolbar.Action>
        </ActionToolbar.Root>
        <section aria-label="테스트 스위트 리스트" className="col-span-6 flex flex-col gap-3">
          {filteredSuites.length === 0 && (searchQuery || filterType !== '전체') ? (
            <div className="text-text-3 py-8 text-center">
              검색 결과가 없습니다.
            </div>
          ) : null}
          {filteredSuites.map((suite) => (
            <Link
              key={suite.id}
              href={`/projects/${params.slug}/suites/${suite.id}`}
            >
              <SuiteCard suite={suite} onEdit={() => handleEdit(suite)} />
            </Link>
          ))}
        </section>
        {isOpen && projectId && <SuiteCreateForm onClose={onClose} projectId={projectId} />}
        {editingSuite && <SuiteEditForm suite={editingSuite} onClose={handleCloseEdit} />}
      </MainContainer>
  );
};
