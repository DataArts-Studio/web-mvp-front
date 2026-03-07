'use client';
import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';

import { TestCaseCard, TestCaseCardType, duplicateTestCase } from '@/entities/test-case';
import { projectIdQueryOptions } from '@/entities/project';
import { testSuitesQueryOptions } from '@/entities/test-suite';
import { TestCaseDetailForm, useCreateCase } from '@/features/cases-create';
import { testCasesQueryOptions, testCaseQueryKeys } from '@/features/cases-list';
import { dashboardQueryOptions } from '@/features/dashboard';
import { Input, MainContainer } from '@/shared/lib/primitives';
import { useDisclosure } from '@/shared/hooks';
import { cn } from '@/shared/utils';
import { Select } from '@/shared/lib/primitives/select/select';
import { ActionToolbar, TestTable } from '@/widgets';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, Download, Upload, FolderOpen, FolderClosed, Inbox, Plus, ArrowUpDown, GripVertical } from 'lucide-react';
import { track, TESTCASE_EVENTS } from '@/shared/lib/analytics';
import { exportTestCasesToCSV } from '@/features/cases-export';
import { ImportWizardModal } from '@/features/import-cases';
import { toast } from 'sonner';
import { Skeleton, ProjectErrorFallback } from '@/shared/ui';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useReorderCase, arrayMove } from '@/features/reorder';

const TestCaseSideView = dynamic(
  () => import('@/view/project/cases/test-case-side-view').then(mod => ({ default: mod.TestCaseSideView })),
  { ssr: false }
);
const AnimatePresence = dynamic(
  () => import('framer-motion').then(mod => ({ default: mod.AnimatePresence })),
  { ssr: false }
);

// 정렬 옵션
const SORT_OPTIONS = [
  { value: 'custom', label: '커스텀 순서' },
  { value: 'updatedAt-desc', label: '최근 수정 순' },
  { value: 'updatedAt-asc', label: '오래된 수정 순' },
  { value: 'createdAt-desc', label: '최근 생성 순' },
  { value: 'createdAt-asc', label: '오래된 생성 순' },
  { value: 'title-asc', label: '제목 오름차순' },
  { value: 'title-desc', label: '제목 내림차순' },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]['value'];


const PAGE_SIZE = 15;

type ModalType = 'create' | 'detail' | 'import';

/** Sortable wrapper for a single TC row */
const SortableTestCaseRow = ({
  id,
  children,
  disabled,
}: {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: isDragging ? 'relative' as const : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && 'opacity-50 shadow-lg bg-bg-3')}>
      <div className="flex items-center">
        {!disabled && (
          <button
            type="button"
            className="flex h-full w-6 shrink-0 cursor-grab items-center justify-center text-text-4 hover:text-text-2 active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
};

export const TestCasesView = () => {
  const params = useParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { onClose, onOpen, isActiveType } = useDisclosure<ModalType>();
  const { mutate } = useCreateCase();
  const queryClient = useQueryClient();
  const [selectedTestCaseId, setSelectedTestCaseId] = useState<string | null>(null);

  // 검색 및 필터 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortOption, setSortOption] = useState<SortValue>('custom');
  const [selectedSuiteId, setSelectedSuiteId] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const slug = params.slug as string;

  // 검색어 debounce — 변경 시 1페이지로 초기화
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 스위트/정렬 변경 시 1페이지로 초기화하는 래퍼
  const handleSuiteChange = useCallback((id: string) => {
    setSelectedSuiteId(id);
    setCurrentPage(1);
  }, []);
  const handleSortChange = useCallback((value: string) => {
    track(TESTCASE_EVENTS.SORT_CHANGE, { sort: value });
    setSortOption(value as SortValue);
    setCurrentPage(1);
  }, []);

  // slug → projectId를 단일 SELECT로 빠르게 획득 (워터폴 제거)
  const { data: projectIdData } = useQuery(projectIdQueryOptions(slug));
  const projectId = projectIdData?.success ? projectIdData.data.id : undefined;

  // dashboard, testSuites 동시 시작
  const { data: dashboardData, isLoading: isLoadingProject } = useQuery(
    dashboardQueryOptions.stats(slug),
  );

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
    for (const suite of suites) {
      map.set(suite.id, suite.title);
    }
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

  // 현재 필터 라벨 가져오기
  const currentSortLabel = SORT_OPTIONS.find((opt) => opt.value === sortOption)?.label || '최근 수정 순';

  // 테스트 케이스 목록 View 이벤트
  useEffect(() => {
    if (testCasesData?.success) {
      track(TESTCASE_EVENTS.LIST_VIEW, { project_id: projectId });
    }
  }, [testCasesData?.success, projectId]);

  // 페이지 변경 핸들러
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    listRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const duplicateMutation = useMutation({
    mutationFn: (testCaseId: string) => duplicateTestCase(testCaseId),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('테스트 케이스가 복제되었습니다.');
        if (projectId) {
          queryClient.invalidateQueries({ queryKey: testCaseQueryKeys.list(projectId) });
          queryClient.invalidateQueries({ queryKey: ['testSuites', projectId] });
        }
      } else {
        const msg = Object.values(result.errors ?? {}).flat().join(', ');
        toast.error(msg || '복제에 실패했습니다.');
      }
    },
  });

  const handleDuplicate = useCallback((testCaseId: string) => {
    duplicateMutation.mutate(testCaseId);
  }, [duplicateMutation]);

  // D&D 설정
  const isCustomSort = sortOption === 'custom';
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );
  const reorderMutation = useReorderCase(projectId ?? '', queryParams);
  const [localItems, setLocalItems] = useState<TestCaseCardType[] | null>(null);

  // 서버 데이터 변경 시 localItems 리셋
  useEffect(() => {
    setLocalItems(null);
  }, [testCasesData]);

  const displayItems = localItems ?? testCaseItems;

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const items = localItems ?? testCaseItems;
    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(items, oldIndex, newIndex);
    setLocalItems(reordered);

    const beforeItem = newIndex > 0 ? reordered[newIndex - 1] : null;
    const afterItem = newIndex < reordered.length - 1 ? reordered[newIndex + 1] : null;

    reorderMutation.mutate({
      id: active.id as string,
      beforeOrder: beforeItem?.sortOrder ?? null,
      afterOrder: afterItem?.sortOrder ?? null,
      orderedIds: reordered.map((item) => item.id),
      projectId: projectId!,
      scopeId: selectedSuiteId !== 'all' ? selectedSuiteId : projectId!,
    });
  }, [localItems, testCaseItems, reorderMutation, projectId, selectedSuiteId]);

  // 로딩 상태 — 스켈레톤 UI (레이아웃에 Container+Aside 포함)
  if (isLoadingProject || (isLoadingCases && !testCasesData)) {
    const SKELETON_WIDTHS = [70, 55, 85, 60, 75, 50, 90, 65, 80, 45, 70, 60, 85, 55, 75];
    return (
      <MainContainer className="flex min-h-screen w-full flex-1 overflow-hidden">
        <nav className="border-line-2 bg-bg-1 flex h-screen w-60 shrink-0 flex-col border-r">
          <div className="border-line-2 border-b px-4 py-3">
            <Skeleton className="h-5 w-12" />
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2">
                <Skeleton className="h-4 w-4 shrink-0" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-3 w-5" />
              </div>
            ))}
          </div>
        </nav>
        <div className="mx-auto grid min-h-screen w-full max-w-[1200px] flex-1 grid-cols-6 content-start gap-x-5 gap-y-8 overflow-y-auto px-10 py-8">
          <header className="border-line-2 col-span-6 flex flex-col gap-2 border-b pb-6">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-5 w-80" />
          </header>
          <div className="col-span-6 flex items-center justify-between gap-4">
            <div className="flex w-full max-w-3xl items-center gap-3">
              <Skeleton className="h-10 flex-1 rounded-2 border border-line-2 bg-bg-2" />
              <Skeleton className="h-10 w-44 shrink-0 rounded-2 border border-line-2 bg-bg-2" />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-40 rounded-2" />
            </div>
          </div>
          <section className="rounded-3 border-line-2 bg-bg-2 col-span-6 border">
            <div className="flex items-center gap-3 border-b border-line-2 bg-primary/5 px-4 py-2.5">
              <Skeleton className="rounded-1 h-6 w-6 bg-primary/20" />
              <Skeleton className="h-5 flex-1" />
            </div>
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="flex items-stretch gap-0 border-b border-line-2 px-4 py-3">
                <Skeleton className="w-[3px] shrink-0 rounded-full" />
                <div className="flex flex-1 flex-col gap-1.5 pl-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-12" />
                    <div style={{ width: `${SKELETON_WIDTHS[i % SKELETON_WIDTHS.length]}%` }}>
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="ml-auto h-3 w-12" />
                  </div>
                </div>
              </div>
            ))}
          </section>
        </div>
      </MainContainer>
    );
  }

  if (!dashboardData?.success) return <ProjectErrorFallback />;

  const handleCreateTestCase = () => {
    const title = inputRef.current?.value.trim();
    if (!title) return;

    // optimistic update로 즉시 반영되므로 입력 즉시 초기화
    if (inputRef.current) inputRef.current.value = '';

    const suiteId = selectedSuiteId !== 'all' && selectedSuiteId !== '__uncategorized__' ? selectedSuiteId : undefined;
    mutate(
      { title, projectId: projectId!, ...(suiteId ? { testSuiteId: suiteId } : {}) },
      {
        onError: (error) => {
          toast.error(error.message || '테스트 케이스 생성에 실패했습니다.');
        },
      },
    );
  };

  return (
    <>
      <MainContainer className="flex min-h-screen w-full flex-1 overflow-hidden">
        {/* 스위트 트리 사이드바 — 고정, 독립 스크롤 */}
        <nav className="border-line-2 bg-bg-1 flex h-screen w-60 shrink-0 flex-col border-r sticky top-0">
          <div className="border-line-2 border-b px-4 py-3">
            <h3 className="typo-body2-heading text-text-2">스위트</h3>
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {/* 전체 */}
            <button
              type="button"
              onClick={() => handleSuiteChange('all')}
              className={cn(
                'flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors',
                selectedSuiteId === 'all'
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-text-2 hover:bg-bg-2'
              )}
            >
              <Inbox className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">전체 케이스</span>
              {pagination && <span className="text-text-3 text-xs">{pagination.totalItems}</span>}
            </button>

            {/* 스위트 목록 */}
            {suites.map((suite) => {
              const isSelected = selectedSuiteId === suite.id;
              return (
                <button
                  key={suite.id}
                  type="button"
                  onClick={() => handleSuiteChange(suite.id)}
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
                </button>
              );
            })}

            {/* 미분류 */}
            <button
              type="button"
              onClick={() => handleSuiteChange('__uncategorized__')}
              className={cn(
                'flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors',
                selectedSuiteId === '__uncategorized__'
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-text-3 hover:bg-bg-2'
              )}
            >
              <Inbox className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">미분류</span>
            </button>
          </div>
        </nav>

        {/* 메인 콘텐츠 — 독립 스크롤 */}
        <div ref={listRef} className="mx-auto grid h-screen w-full max-w-[1200px] flex-1 grid-cols-6 content-start gap-x-5 gap-y-8 overflow-y-auto px-10 py-8">
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
                : pagination
                  ? `${pagination.totalItems}개의 테스트 케이스`
                  : ''}
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
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.trim()) {
                    track(TESTCASE_EVENTS.SEARCH, { keyword: e.target.value.trim() });
                  }
                }}
              />
              {/* Sort Dropdown */}
              <Select.Root value={sortOption} onValueChange={handleSortChange} className="relative shrink-0 w-fit">
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
            <ActionToolbar.Action size="small" type="button" variant="ghost" onClick={() => {
              track(TESTCASE_EVENTS.IMPORT_START, { project_id: projectId });
              onOpen('import');
            }} className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span className="leading-none">가져오기</span>
            </ActionToolbar.Action>
            <ActionToolbar.Action size="small" type="button" variant="ghost" onClick={() => {
              track(TESTCASE_EVENTS.EXPORT, { project_id: projectId, count: testCaseItems.length });
              const projectName = dashboardData?.success ? dashboardData.data.project.name : 'project';
              exportTestCasesToCSV(testCaseItems, projectName);
            }} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <span className="leading-none">내보내기</span>
            </ActionToolbar.Action>
            <ActionToolbar.Action size="small" type="button" variant="solid" onClick={() => { track(TESTCASE_EVENTS.CREATE_START, { project_id: projectId }); onOpen('create'); }} className='flex items-center gap-2'>
              <Plus className="h-4 w-4" />
              <span className='leading-none'>테스트 케이스 생성</span>
            </ActionToolbar.Action>
          </ActionToolbar.Root>

          {/* Test Case List Container */}
          <section className={cn(
            "rounded-3 border-line-2 bg-bg-2 shadow-1 col-span-6 border transition-opacity",
            isFetching && testCasesData ? 'opacity-60' : 'opacity-100'
          )}>
            {/* Quick-create row */}
            <div className="flex items-center gap-3 border-b border-line-2 bg-primary/5 px-4 py-3 transition-colors hover:bg-primary/10">
              <div className="rounded-1 bg-primary/20 text-primary flex h-6 w-6 shrink-0 items-center justify-center">
                <Plus className="h-4 w-4" />
              </div>
              <Input
                ref={inputRef}
                type="text"
                placeholder="새로운 테스트 케이스 이름을 입력하고 Enter를 누르세요..."
                className="typo-body2-normal text-text-1 placeholder:text-text-3 flex-1 bg-transparent focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateTestCase();
                  }
                }}
              />
            </div>

            {/* List */}
            {testCaseItems.length === 0 && pagination && pagination.totalItems === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12">
                <p className="typo-body2-normal text-text-3">
                  {debouncedSearch || selectedSuiteId !== 'all' ? '검색 결과가 없습니다.' : '테스트 케이스가 없습니다.'}
                </p>
                {(debouncedSearch || selectedSuiteId !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      handleSuiteChange('all');
                    }}
                    className="typo-body2-normal text-primary hover:underline"
                  >
                    필터 초기화
                  </button>
                )}
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={displayItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                  <div className="divide-y divide-line-2">
                    {displayItems.map((item) => (
                      <SortableTestCaseRow key={item.isOptimistic ? item.id : item.caseKey} id={item.id} disabled={!isCustomSort || item.isOptimistic}>
                        <div
                          className={cn(
                            "group flex cursor-pointer items-center overflow-hidden px-4 py-3 transition-colors hover:bg-bg-3",
                            item.isOptimistic && "opacity-50 pointer-events-none animate-pulse"
                          )}
                          onClick={() => {
                            track(TESTCASE_EVENTS.ITEM_CLICK, { case_id: item.id });
                            setSelectedTestCaseId(item.id);
                            onOpen('detail');
                          }}
                        >
                          <TestCaseCard testCase={item} onDuplicate={handleDuplicate} />
                        </div>
                      </SortableTestCaseRow>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            {/* Pagination */}
            {pagination && (
              <TestTable.Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                onPageChange={handlePageChange}
              />
            )}
          </section>
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
