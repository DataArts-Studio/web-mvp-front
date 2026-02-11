'use client';
import React, { useState, useMemo } from 'react';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { SuiteCard } from '@/entities/test-suite/ui/suite-card';
import type { TestSuiteCard } from '@/entities/test-suite';
import { dashboardQueryOptions, SuiteEditForm } from '@/features';
import { SuiteCreateForm } from '@/features/suites-create';
import { Container, MainContainer, LoadingSpinner } from '@/shared';
import { useDisclosure } from '@/shared/hooks';
import { ActionToolbar, Aside, testSuitesQueryOptions } from '@/widgets';
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

  const { data: dashboardData, isLoading: isLoadingProject } = useQuery(dashboardQueryOptions.stats(params.slug as string));
  const projectId = dashboardData?.success ? dashboardData.data.project.id : undefined;

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

  // 로딩 상태
  if (isLoadingProject || isLoadingSuites) {
    return (
      <Container className="bg-bg-1 text-text-1 flex min-h-screen font-sans">
        <Aside />
        <MainContainer className="flex flex-1 items-center justify-center">
          <LoadingSpinner size="lg" />
        </MainContainer>
      </Container>
    );
  }

  // 에러 상태
  if (!dashboardData?.success) {
    return (
      <Container className="bg-bg-1 text-text-1 flex min-h-screen font-sans">
        <Aside />
        <MainContainer className="flex flex-1 items-center justify-center">
          <div className="text-red-400">프로젝트를 불러올 수 없습니다.</div>
        </MainContainer>
      </Container>
    );
  }

  return (
    <Container className="bg-bg-1 text-text-1 flex min-h-screen font-sans">
      {/* Aside */}
      <Aside />
      {/* Main Content */}
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
    </Container>
  );
};
