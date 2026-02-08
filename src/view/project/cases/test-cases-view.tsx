'use client';
import React, { useRef, useState, useMemo, useEffect, lazy, Suspense } from 'react';

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';

import { TestCaseCard, TestCaseCardType } from '@/entities/test-case';
import { testSuitesQueryOptions } from '@/entities/test-suite';
import { TestCaseDetailForm, useCreateCase } from '@/features/cases-create';
import { testCasesQueryOptions } from '@/features/cases-list';
import { dashboardQueryOptions } from '@/features/dashboard';
import { Container, Input, MainContainer, LoadingSpinner } from '@/shared';
import { useDisclosure } from '@/shared/hooks';
import { cn } from '@/shared/utils';
import { Select } from '@/shared/lib/primitives/select/select';
import { ActionToolbar, Aside, TestTable } from '@/widgets';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Filter, FolderOpen, FolderClosed, Inbox, Plus, ArrowUpDown } from 'lucide-react';

const TestCaseSideView = dynamic(
  () => import('@/view/project/cases/test-case-side-view').then(mod => ({ default: mod.TestCaseSideView })),
  { ssr: false }
);
const AnimatePresence = dynamic(
  () => import('framer-motion').then(mod => ({ default: mod.AnimatePresence })),
  { ssr: false }
);

// 상태 필터 옵션
const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'pass', label: 'Pass' },
  { value: 'fail', label: 'Fail' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'untested', label: 'Untested' },
] as const;

type StatusFilterValue = (typeof STATUS_FILTER_OPTIONS)[number]['value'];

// 정렬 옵션
const SORT_OPTIONS = [
  { value: 'updatedAt-desc', label: '최근 수정 순' },
  { value: 'updatedAt-asc', label: '오래된 수정 순' },
  { value: 'createdAt-desc', label: '최근 생성 순' },
  { value: 'createdAt-asc', label: '오래된 생성 순' },
  { value: 'title-asc', label: '제목 오름차순' },
  { value: 'title-desc', label: '제목 내림차순' },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]['value'];

const TABLE_HEADERS = [
  { id: 'id', label: 'ID', colSpan: 'col-span-2' },
  { id: 'title', label: '제목', colSpan: 'col-span-4' },
  { id: 'status', label: '상태', colSpan: 'col-span-2', textAlign: 'text-center' },
  { id: 'updatedAt', label: '최종 수정', colSpan: 'col-span-3', textAlign: 'text-center' },
  { id: 'actions', label: '메뉴', colSpan: 'col-span-1', textAlign: 'text-right' },
] as const;

type ModalType = 'create' | 'detail';

export const TestCasesView = () => {
  const params = useParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const { onClose, onOpen, isActiveType } = useDisclosure<ModalType>();
  const { mutate, isPending } = useCreateCase();
  const [selectedTestCaseId, setSelectedTestCaseId] = useState<string | null>(null);

  // 검색 및 필터 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('all');
  const [sortOption, setSortOption] = useState<SortValue>('updatedAt-desc');
  const [selectedSuiteId, setSelectedSuiteId] = useState<string>('all');

  // 페이지네이션 상태
  const [visibleCount, setVisibleCount] = useState(30);
  const PAGE_SIZE = 30;

  const { data: dashboardData, isLoading: isLoadingProject } = useQuery(
    dashboardQueryOptions.stats(params.slug as string),
  );

  const projectId = dashboardData?.success ? dashboardData.data.project.id : undefined;

  const { data: testCasesData, isLoading: isLoadingCases } = useQuery({
    ...testCasesQueryOptions(projectId!),
    enabled: !!projectId,
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
    for (const suite of suites) {
      map.set(suite.id, suite.title);
    }
    return map;
  }, [suites]);

  const testCases: TestCaseCardType[] = testCasesData?.success
    ? testCasesData.data.map((item) => ({
        ...item,
        suiteTitle: item.testSuiteId ? (suiteMap.get(item.testSuiteId) || '') : '',
        status: 'untested' as const,
        lastExecutedAt: null,
      }))
    : [];

  // 스위트별 케이스 개수
  const suiteCaseCounts = useMemo(() => {
    const counts = new Map<string, number>();
    let uncategorized = 0;
    for (const tc of testCases) {
      if (tc.testSuiteId) {
        counts.set(tc.testSuiteId, (counts.get(tc.testSuiteId) || 0) + 1);
      } else {
        uncategorized++;
      }
    }
    return { counts, uncategorized };
  }, [testCases]);

  // 필터링 및 정렬된 테스트 케이스
  const filteredAndSortedTestCases = useMemo(() => {
    let result = [...testCases];

    // 스위트 필터링
    if (selectedSuiteId !== 'all') {
      if (selectedSuiteId === '__uncategorized__') {
        result = result.filter((tc) => !tc.testSuiteId);
      } else {
        result = result.filter((tc) => tc.testSuiteId === selectedSuiteId);
      }
    }

    // 검색 필터링
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (tc) =>
          tc.title.toLowerCase().includes(query) ||
          tc.caseKey.toLowerCase().includes(query)
      );
    }

    // 상태 필터링
    if (statusFilter !== 'all') {
      result = result.filter((tc) => tc.resultStatus === statusFilter);
    }

    // 정렬
    const [sortField, sortOrder] = sortOption.split('-') as [string, 'asc' | 'desc'];
    result.sort((a, b) => {
      let comparison = 0;

      if (sortField === 'title') {
        comparison = a.title.localeCompare(b.title, 'ko');
      } else if (sortField === 'updatedAt') {
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      } else if (sortField === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [testCases, searchQuery, statusFilter, sortOption, selectedSuiteId]);

  // 현재 필터 라벨 가져오기
  const currentStatusLabel = STATUS_FILTER_OPTIONS.find((opt) => opt.value === statusFilter)?.label || '전체';
  const currentSortLabel = SORT_OPTIONS.find((opt) => opt.value === sortOption)?.label || '최근 수정 순';

  // 필터 변경 시 visibleCount 초기화
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, statusFilter, sortOption, selectedSuiteId]);

  // 로딩 상태
  if (isLoadingProject || isLoadingCases) {
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

  const handleCreateTestCase = () => {
    const title = inputRef.current?.value.trim();
    if (!title || isPending) return;

    mutate(
      { title, projectId: projectId! },
      {
        onSuccess: () => {
          if (inputRef.current) inputRef.current.value = '';
        },
      },
    );
  };

  return (
    <Container className="bg-bg-1 text-text-1 flex min-h-screen font-sans">
      <Aside />
      <MainContainer className="flex min-h-screen w-full flex-1">
        {/* 스위트 트리 사이드바 */}
        <nav className="border-line-2 bg-bg-1 flex w-60 shrink-0 flex-col border-r">
          <div className="border-line-2 border-b px-4 py-3">
            <h3 className="typo-body2-heading text-text-2">스위트</h3>
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {/* 전체 */}
            <button
              type="button"
              onClick={() => setSelectedSuiteId('all')}
              className={cn(
                'flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors',
                selectedSuiteId === 'all'
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-text-2 hover:bg-bg-2'
              )}
            >
              <Inbox className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">전체 케이스</span>
              <span className="text-text-3 text-xs">{testCases.length}</span>
            </button>

            {/* 스위트 목록 */}
            {suites.map((suite) => {
              const count = suiteCaseCounts.counts.get(suite.id) || 0;
              const isSelected = selectedSuiteId === suite.id;
              return (
                <button
                  key={suite.id}
                  type="button"
                  onClick={() => setSelectedSuiteId(suite.id)}
                  className={cn(
                    'flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors',
                    isSelected
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-text-2 hover:bg-bg-2'
                  )}
                >
                  {isSelected
                    ? <FolderOpen className="h-4 w-4 shrink-0" />
                    : <FolderClosed className="h-4 w-4 shrink-0" />
                  }
                  <span className="flex-1 truncate">{suite.title}</span>
                  <span className="text-text-3 text-xs">{count}</span>
                </button>
              );
            })}

            {/* 미분류 */}
            {suiteCaseCounts.uncategorized > 0 && (
              <button
                type="button"
                onClick={() => setSelectedSuiteId('__uncategorized__')}
                className={cn(
                  'flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors',
                  selectedSuiteId === '__uncategorized__'
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-text-3 hover:bg-bg-2'
                )}
              >
                <Inbox className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">미분류</span>
                <span className="text-text-3 text-xs">{suiteCaseCounts.uncategorized}</span>
              </button>
            )}
          </div>
        </nav>

        {/* 메인 콘텐츠 */}
        <div className="mx-auto grid w-full max-w-[1200px] flex-1 grid-cols-6 content-start gap-x-5 gap-y-8 px-10 py-8">
          {/* Header */}
          <header className="border-line-2 col-span-6 flex flex-col gap-1 border-b pb-6">
            <h2 className="typo-h1-heading text-text-1">
              {selectedSuiteId === 'all'
                ? '테스트 케이스 관리'
                : selectedSuiteId === '__uncategorized__'
                  ? '미분류'
                  : suiteMap.get(selectedSuiteId) || '테스트 케이스 관리'}
            </h2>
            <p className="typo-body2-normal text-text-2">
              {selectedSuiteId === 'all'
                ? '프로젝트의 모든 테스트 케이스를 조회하고 관리합니다.'
                : `${filteredAndSortedTestCases.length}개의 테스트 케이스`}
            </p>
          </header>

          <ActionToolbar.Root
            ariaLabel="테스트 케이스 컨트롤"
            className="col-span-6 flex items-center justify-between gap-4 bg-transparent p-0"
          >
            <ActionToolbar.Group className="relative w-full max-w-3xl">
              <ActionToolbar.Search
                placeholder="테스트 케이스 제목을 입력해 주세요."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {/* Status Filter Dropdown */}
              <Select.Root value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilterValue)} className="relative shrink-0 w-fit">
                <Select.Trigger className="typo-body2-heading rounded-2 border-line-2 bg-bg-2 text-text-2 hover:bg-bg-3 flex items-center gap-2 border px-3 py-2 transition-colors cursor-pointer whitespace-nowrap">
                  <Filter className="h-4 w-4 shrink-0" />
                  <span>상태: {currentStatusLabel}</span>
                  <ChevronDown className="text-text-3 h-4 w-4 shrink-0" />
                </Select.Trigger>
                <Select.Content className="absolute top-full left-0 min-w-full mt-1 z-50 rounded-2 border border-line-2 bg-bg-2 py-1 shadow-lg">
                  {STATUS_FILTER_OPTIONS.map((option) => (
                    <Select.Item
                      key={option.value}
                      value={option.value}
                      className="typo-body2-normal px-3 py-2 text-text-2 hover:bg-bg-3 hover:text-text-1 cursor-pointer data-[state=checked]:bg-primary/10 data-[state=checked]:text-primary whitespace-nowrap"
                    >
                      {option.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
              {/* Sort Dropdown */}
              <Select.Root value={sortOption} onValueChange={(value) => setSortOption(value as SortValue)} className="relative shrink-0 w-fit">
                <Select.Trigger className="typo-body2-heading rounded-2 border-line-2 bg-bg-2 text-text-2 hover:bg-bg-3 flex items-center gap-2 border px-3 py-2 transition-colors cursor-pointer whitespace-nowrap">
                  <ArrowUpDown className="h-4 w-4 shrink-0" />
                  <span>정렬: {currentSortLabel}</span>
                  <ChevronDown className="text-text-3 h-4 w-4 shrink-0" />
                </Select.Trigger>
                <Select.Content className="absolute top-full left-0 min-w-full mt-1 z-50 rounded-2 border border-line-2 bg-bg-2 py-1 shadow-lg">
                  {SORT_OPTIONS.map((option) => (
                    <Select.Item
                      key={option.value}
                      value={option.value}
                      className="typo-body2-normal px-3 py-2 text-text-2 hover:bg-bg-3 hover:text-text-1 cursor-pointer data-[state=checked]:bg-primary/10 data-[state=checked]:text-primary whitespace-nowrap"
                    >
                      {option.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </ActionToolbar.Group>
            <ActionToolbar.Action size="small" type="button" variant="solid" onClick={() => onOpen('create')} className='flex items-center gap-2'>
              <Plus className="h-4 w-4" />
              <span className='leading-none'>테스트 케이스 생성</span>
            </ActionToolbar.Action>
          </ActionToolbar.Root>

          {/* Test Case List Container */}
          <section className="rounded-4 border-line-2 bg-bg-2 shadow-1 col-span-6 overflow-hidden border">
            <TestTable.Root>
              <TestTable.Header headers={TABLE_HEADERS} />
              <TestTable.Row className="group border-line-2 bg-primary/5 hover:bg-primary/10 grid grid-cols-12 gap-4 border-b px-6 py-3 transition-colors">
                <div className="col-span-12 flex items-center gap-3">
                  <div className="rounded-1 bg-primary/20 text-primary flex h-6 w-6 items-center justify-center">
                    <Plus className="h-4 w-4" />
                  </div>
                  <Input
                    ref={inputRef}
                    type="text"
                    placeholder="새로운 테스트 케이스 이름을 입력하고 Enter를 누르세요..."
                    className="typo-body2-normal text-text-1 placeholder:text-text-3 flex-1 bg-transparent focus:outline-none"
                    disabled={isPending}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateTestCase();
                      }
                    }}
                  />
                </div>
              </TestTable.Row>
              {filteredAndSortedTestCases.length === 0 && testCases.length > 0 ? (
                <div className="col-span-12 flex flex-col items-center justify-center gap-2 py-12">
                  <p className="typo-body2-normal text-text-3">검색 결과가 없습니다.</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                      setSelectedSuiteId('all');
                    }}
                    className="typo-body2-normal text-primary hover:underline"
                  >
                    필터 초기화
                  </button>
                </div>
              ) : (
                filteredAndSortedTestCases.slice(0, visibleCount).map((item) => (
                  <TestTable.Row key={item.caseKey} onClick={() => {
                    setSelectedTestCaseId(item.id);
                    onOpen('detail');
                  }}>
                    <TestCaseCard testCase={item} />
                  </TestTable.Row>
                ))
              )}
              {filteredAndSortedTestCases.length >= PAGE_SIZE && visibleCount < filteredAndSortedTestCases.length && (
                <div className="flex justify-center py-4">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                    className="typo-body2-heading text-primary hover:text-primary/80 transition-colors"
                  >
                    더보기 ({filteredAndSortedTestCases.length - visibleCount}개 더)
                  </button>
                </div>
              )}
            </TestTable.Root>
          </section>
        </div>
      </MainContainer>
      {isActiveType('create') && <TestCaseDetailForm projectId={projectId!} onClose={onClose} />}
      <AnimatePresence>
        {isActiveType('detail') && selectedTestCaseId && (
          <TestCaseSideView
            testCase={testCases.find(tc => tc.id === selectedTestCaseId)}
            onClose={() => {
              setSelectedTestCaseId(null);
              onClose();
            }}
          />
        )}
      </AnimatePresence>
    </Container>
  );
};
