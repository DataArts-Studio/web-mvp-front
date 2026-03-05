'use client';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MainContainer } from '@/shared/lib/primitives';
import { Dialog } from '@/shared/lib/primitives/dialog/dialog';
import { useOutsideClick } from '@/shared/hooks';
import {
  Search,
  Filter,
  ChevronDown,
  PlayCircle,
  Clock,
  CheckCircle2,
  ListTodo,
  ArrowUpDown,
  X,
  Plus,
  AlertCircle,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { DSButton, RUN_STATUS_CONFIG, Skeleton, EmptyState, Pagination } from '@/shared/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { projectIdQueryOptions } from '@/entities/project';
import { dashboardQueryOptions } from '@/features/dashboard';
import { testRunsQueryOptions, deleteTestRun } from '@/features/runs';
import { track, TESTRUN_EVENTS } from '@/shared/lib/analytics';
import { toast } from 'sonner';

const PAGE_SIZE = 10;
type RunStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
type RunSourceType = 'SUITE' | 'MILESTONE' | 'ADHOC';
type StatusFilter = 'ALL' | RunStatus;

interface ITestRun {
  id: string;
  name: string;
  sourceType: RunSourceType;
  sourceName: string;
  status: RunStatus;
  updatedAt: Date;
  stats: {
    totalCases: number;
    completedCases: number;
    progressPercent: number;
    pass: number;
    fail: number;
    blocked: number;
    untested: number;
  };
}

export const TestRunsListView = () => {
  const params = useParams();
  const router = useRouter();
  const projectSlug = params.slug as string;

  // 검색어 상태
  const [searchTerm, setSearchTerm] = useState('');
  // 상태 필터
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  // 정렬 옵션
  const [sortOption, setSortOption] = useState<'UPDATED' | 'NAME'>('UPDATED');
  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);
  // 드롭다운 열림 상태
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // 삭제 확인 다이얼로그 상태
  const [deleteTarget, setDeleteTarget] = useState<ITestRun | null>(null);
  const queryClient = useQueryClient();

  // 드롭다운 외부 클릭 감지를 위한 ref
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫기
  useOutsideClick(sortDropdownRef, () => setIsSortDropdownOpen(false));
  useOutsideClick(statusDropdownRef, () => setIsStatusDropdownOpen(false));

  // slug → projectId를 가벼운 쿼리로 빠르게 획득 (워터폴 제거)
  const { data: projectIdData } = useQuery(projectIdQueryOptions(projectSlug));
  const projectId = projectIdData?.success ? projectIdData.data.id : undefined;

  const { data: dashboardData, isLoading: isLoadingProject } = useQuery(
    dashboardQueryOptions.stats(projectSlug)
  );

  const { data: fetchedRunsData, isLoading: isLoadingRuns, refetch: refetchRuns } = useQuery({
    ...testRunsQueryOptions(projectId!),
    enabled: !!projectId,
  });

  const testRuns: ITestRun[] = (fetchedRunsData?.success ? fetchedRunsData.data : []) as ITestRun[];
  const hasError = (dashboardData && !dashboardData.success) || (fetchedRunsData && !fetchedRunsData.success);

  const deleteMutation = useMutation({
    mutationFn: (testRunId: string) => deleteTestRun(testRunId),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('테스트 실행이 삭제되었습니다.');
        queryClient.invalidateQueries({ queryKey: ['testRuns', projectId] });
      } else {
        toast.error(Object.values(result.errors).flat().join(', '));
      }
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error('삭제 중 오류가 발생했습니다.');
      setDeleteTarget(null);
    },
  });

  // 테스트 실행 목록 View 이벤트
  useEffect(() => {
    if (fetchedRunsData?.success) {
      track(TESTRUN_EVENTS.LIST_VIEW, { project_id: projectId });
    }
  }, [fetchedRunsData?.success, projectId]);

  // 검색어 및 상태 필터링 적용
  const filteredRuns = testRuns.filter((run) => {
    // 검색어 필터 (이름 또는 소스 이름)
    const matchesSearch =
      searchTerm === '' ||
      run.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      run.sourceName.toLowerCase().includes(searchTerm.toLowerCase());

    // 상태 필터
    const matchesStatus = statusFilter === 'ALL' || run.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // 정렬 적용
  const sortedRuns = [...filteredRuns].sort((a, b) => {
    if (sortOption === 'NAME') return a.name.localeCompare(b.name);
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  // 페이지네이션 계산
  const totalItems = sortedRuns.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  const paginatedRuns = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedRuns.slice(start, start + PAGE_SIZE);
  }, [sortedRuns, currentPage]);

  // 상태 필터 라벨
  const getStatusFilterLabel = (filter: StatusFilter) => {
    switch (filter) {
      case 'ALL': return '전체 상태';
      case 'COMPLETED': return '완료됨';
      case 'IN_PROGRESS': return '진행 중';
      case 'NOT_STARTED': return '시작 전';
    }
  };

  // 검색어 초기화
  const clearSearch = () => { setSearchTerm(''); setCurrentPage(1); };

  const getSourceIcon = (type: RunSourceType) => {
    switch(type) {
      case 'SUITE': return <ListTodo className="h-3.5 w-3.5" />;
      case 'MILESTONE': return <Clock className="h-3.5 w-3.5" />;
      default: return <PlayCircle className="h-3.5 w-3.5" />;
    }
  };

  // 로딩 상태 — 스켈레톤 UI
  if (isLoadingProject || (projectId && isLoadingRuns)) {
    return (
      <MainContainer className="grid min-h-screen w-full flex-1 grid-cols-6 content-start gap-x-5 gap-y-8 py-8 max-w-[1200px] mx-auto px-10">
        {/* Header skeleton */}
        <header className="col-span-6 flex items-start justify-between border-b border-line-2 pb-6">
          <div className="flex flex-col gap-1">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-80" />
          </div>
          <Skeleton className="h-10 w-40 rounded-2" />
        </header>
        {/* Filter skeleton */}
        <section className="col-span-6 flex items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-3">
            <Skeleton className="h-10 w-full max-w-md rounded-2 border border-line-2 bg-bg-2" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-32 rounded-2 border border-line-2 bg-bg-2" />
            <Skeleton className="h-10 w-36 rounded-2 border border-line-2 bg-bg-2" />
          </div>
        </section>
        {/* Table skeleton */}
        <section className="col-span-6 flex flex-col overflow-hidden rounded-4 border border-line-2 bg-bg-2 shadow-1">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-4 border-b border-line-2 bg-bg-3 px-6 py-3">
            <Skeleton className="col-span-5 h-3 w-24" />
            <Skeleton className="col-span-3 h-3 w-28" />
            <div className="col-span-2 flex justify-center"><Skeleton className="h-3 w-10" /></div>
            <div className="col-span-2 flex justify-end"><Skeleton className="h-3 w-24" /></div>
          </div>
          {/* Table rows */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="grid grid-cols-12 items-center gap-4 border-b border-line-2 px-6 py-5 last:border-b-0">
              <div className="col-span-5 flex flex-col gap-1.5">
                <Skeleton className="h-5 w-48" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-16 rounded-1" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <div className="col-span-3 flex flex-col gap-2 pr-4">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-8" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
              <div className="col-span-2 flex justify-center">
                <Skeleton className="h-6 w-20 rounded-1" />
              </div>
              <div className="col-span-2 flex flex-col items-end gap-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          ))}
        </section>
      </MainContainer>
    );
  }

  return (
    <>
    <MainContainer className="grid h-screen w-full flex-1 grid-cols-6 grid-rows-[auto_auto_1fr] gap-x-5 gap-y-8 overflow-hidden py-8 max-w-[1200px] mx-auto px-10">
        <header className="col-span-6 flex items-start justify-between border-b border-line-2 pb-6">
          <div className="flex flex-col gap-1">
            <h2 className="typo-h1-heading text-text-1">테스트 실행 목록</h2>
            <p className="typo-body2-normal text-text-2">
              프로젝트의 모든 테스트 실행(Test Run) 진행 상황을 확인하고 관리합니다.
            </p>
          </div>
          <DSButton
            variant="solid"
            className="flex items-center gap-2"
            onClick={() => { track(TESTRUN_EVENTS.CREATE_START, { project_id: projectId }); router.push(`/projects/${projectSlug}/runs/create`); }}
          >
            <Plus className="h-4 w-4" />
            테스트 실행 생성
          </DSButton>
        </header>

        <section className="col-span-6 flex items-center justify-between gap-4">
          {/* 검색창 */}
          <div className="flex flex-1 items-center gap-3">
            <div className="relative w-full max-w-md">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-3">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="실행 이름 검색..."
                className="typo-body2-normal w-full rounded-2 border border-line-2 bg-bg-2 py-2 pl-10 pr-10 text-text-1 placeholder:text-text-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-3 hover:text-text-1 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 상태 필터 드롭다운 */}
            <div className="relative" ref={statusDropdownRef}>
              <button
                onClick={() => {
                  setIsStatusDropdownOpen(!isStatusDropdownOpen);
                  setIsSortDropdownOpen(false);
                }}
                className={`typo-body2-heading flex items-center gap-2 rounded-2 border px-3 py-2 transition-colors ${
                  statusFilter !== 'ALL'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-line-2 bg-bg-2 text-text-2 hover:bg-bg-3'
                }`}
              >
                <Filter className="h-4 w-4" />
                <span>{getStatusFilterLabel(statusFilter)}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isStatusDropdownOpen && (
                <div className="absolute right-0 top-full z-10 mt-1 min-w-[160px] overflow-hidden rounded-2 border border-line-2 bg-bg-2 shadow-2">
                  {(['ALL', 'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] as StatusFilter[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setStatusFilter(status);
                        setIsStatusDropdownOpen(false);
                        setCurrentPage(1);
                      }}
                      className={`typo-body2-normal flex w-full items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-bg-3 ${
                        statusFilter === status ? 'bg-bg-3 text-primary' : 'text-text-2'
                      }`}
                    >
                      {statusFilter === status && <CheckCircle2 className="h-4 w-4" />}
                      <span className={statusFilter === status ? '' : 'pl-6'}>
                        {getStatusFilterLabel(status)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 정렬 드롭다운 */}
            <div className="relative" ref={sortDropdownRef}>
              <button
                onClick={() => {
                  setIsSortDropdownOpen(!isSortDropdownOpen);
                  setIsStatusDropdownOpen(false);
                }}
                className="typo-body2-heading flex items-center gap-2 rounded-2 border border-line-2 bg-bg-2 px-3 py-2 text-text-2 hover:bg-bg-3 transition-colors"
              >
                <ArrowUpDown className="h-4 w-4" />
                <span>{sortOption === 'UPDATED' ? '최근 수정 순' : '이름 순'}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSortDropdownOpen && (
                <div className="absolute right-0 top-full z-10 mt-1 min-w-[160px] overflow-hidden rounded-2 border border-line-2 bg-bg-2 shadow-2">
                  <button
                    onClick={() => {
                      setSortOption('UPDATED');
                      setIsSortDropdownOpen(false);
                    }}
                    className={`typo-body2-normal flex w-full items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-bg-3 ${
                      sortOption === 'UPDATED' ? 'bg-bg-3 text-primary' : 'text-text-2'
                    }`}
                  >
                    {sortOption === 'UPDATED' && <CheckCircle2 className="h-4 w-4" />}
                    <span className={sortOption === 'UPDATED' ? '' : 'pl-6'}>최근 수정 순</span>
                  </button>
                  <button
                    onClick={() => {
                      setSortOption('NAME');
                      setIsSortDropdownOpen(false);
                    }}
                    className={`typo-body2-normal flex w-full items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-bg-3 ${
                      sortOption === 'NAME' ? 'bg-bg-3 text-primary' : 'text-text-2'
                    }`}
                  >
                    {sortOption === 'NAME' && <CheckCircle2 className="h-4 w-4" />}
                    <span className={sortOption === 'NAME' ? '' : 'pl-6'}>이름 순</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="col-span-6 flex min-h-0 flex-col overflow-hidden rounded-4 border border-line-2 bg-bg-2 shadow-1">
          {/* 검색 결과 요약 */}
          {(searchTerm || statusFilter !== 'ALL') && (
            <div className="flex items-center gap-2 border-b border-line-2 px-6 py-2 text-text-3">
              <span className="typo-body2-normal">
                {sortedRuns.length}개 결과
                {searchTerm && <span className="ml-1">· 검색어: &quot;{searchTerm}&quot;</span>}
                {statusFilter !== 'ALL' && <span className="ml-1">· 상태: {getStatusFilterLabel(statusFilter)}</span>}
              </span>
            </div>
          )}
          <div className="grid grid-cols-[5fr_3fr_2fr_2fr_auto] gap-4 border-b border-line-2 bg-bg-3 px-6 py-3">
            <div className="typo-caption-heading text-text-3 uppercase">실행 이름 / 기준</div>
            <div className="typo-caption-heading text-text-3 uppercase">진행률 (완료/전체)</div>
            <div className="text-center typo-caption-heading text-text-3 uppercase">상태</div>
            <div className="text-right typo-caption-heading text-text-3 uppercase">마지막 업데이트</div>
            <div className="w-9" />
          </div>

          <div className="flex-1 overflow-y-auto">
          {paginatedRuns.map((run) => {
            const { totalCases, completedCases, progressPercent } = run.stats;

            return (
              <div
                key={run.id}
                onClick={() => router.push(`/projects/${projectSlug}/runs/${run.id}`)}
                className="group grid cursor-pointer grid-cols-[5fr_3fr_2fr_2fr_auto] items-center gap-4 border-b border-line-2 px-6 py-5 transition-colors hover:bg-bg-3 last:border-b-0"
              >
                <div className="flex flex-col gap-1.5">
                  <span className="typo-body1-heading text-text-1 group-hover:text-primary transition-colors">
                    {run.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-1 bg-bg-4 px-1.5 py-0.5 text-[11px] font-medium text-text-2">
                      {getSourceIcon(run.sourceType)}
                      {run.sourceType}
                    </span>
                    <span className="typo-caption-normal text-text-3">
                      {run.sourceName}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pr-4">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-text-1">{progressPercent}%</span>
                    <span className="text-text-3">{completedCases} / {totalCases}</span>
                  </div>
                  {(() => {
                    const h = 8;
                    const r = h / 2;
                    if (totalCases === 0) return <div className="h-2 w-full rounded-full bg-bg-4" />;
                    const passP = (run.stats.pass / totalCases) * 100;
                    const failP = (run.stats.fail / totalCases) * 100;
                    const blockedP = (run.stats.blocked / totalCases) * 100;
                    const untestedP = 100 - passP - failP - blockedP;
                    return (
                      <svg width="100%" height={h} className="block overflow-hidden rounded-full">
                        <defs>
                          <clipPath id={`bar-clip-${run.id}`}>
                            <rect x="0" y="0" width="100%" height={h} rx={r} ry={r} />
                          </clipPath>
                        </defs>
                        <g clipPath={`url(#bar-clip-${run.id})`}>
                          {run.stats.pass > 0 && <rect x="0%" y="0" width={`${passP}%`} height={h} fill="#0BB57F" shapeRendering="crispEdges" />}
                          {run.stats.fail > 0 && <rect x={`${passP}%`} y="0" width={`${failP}%`} height={h} fill="#FC4141" shapeRendering="crispEdges" />}
                          {run.stats.blocked > 0 && <rect x={`${passP + failP}%`} y="0" width={`${blockedP}%`} height={h} fill="#FBA900" shapeRendering="crispEdges" />}
                          {untestedP > 0 && <rect x={`${passP + failP + blockedP}%`} y="0" width={`${untestedP}%`} height={h} fill="var(--color-bg-4)" shapeRendering="crispEdges" />}
                        </g>
                      </svg>
                    );
                  })()}
                </div>

                <div className="flex justify-center">
                  <span className={`typo-caption-heading inline-flex items-center rounded-1 px-2.5 py-1 ${RUN_STATUS_CONFIG[run.status]?.style ?? 'bg-bg-4 text-text-3'}`}>
                    {run.status === 'COMPLETED' && <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
                    {run.status === 'IN_PROGRESS' && <PlayCircle className="mr-1.5 h-3.5 w-3.5" />}
                    {RUN_STATUS_CONFIG[run.status]?.label ?? run.status}
                  </span>
                </div>

                <div className="text-right">
                  <span className="typo-caption-normal text-text-3">
                    {new Date(run.updatedAt).toLocaleDateString()}
                  </span>
                  <div className="typo-caption-normal text-text-4">
                    {new Date(run.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(run); }}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-2 text-text-4 opacity-0 transition-all hover:bg-system-red/10 hover:text-system-red group-hover:opacity-100"
                  title="삭제"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}

          {/* 에러 발생 시 */}
          {hasError && testRuns.length === 0 && (
            <EmptyState
              icon={<AlertCircle className="h-6 w-6" />}
              title="데이터를 불러오지 못했습니다."
              description="일시적인 오류가 발생했습니다. 다시 시도해주세요."
              action={
                <DSButton
                  variant="ghost"
                  className="mt-2 flex items-center gap-2"
                  onClick={() => refetchRuns()}
                >
                  <RefreshCw className="h-4 w-4" />
                  다시 시도
                </DSButton>
              }
              className="h-60"
            />
          )}

          {/* 검색/필터 결과가 없을 때 */}
          {testRuns.length > 0 && sortedRuns.length === 0 && (
            <EmptyState
              icon={<Search className="h-6 w-6" />}
              title="검색 결과가 없습니다."
              description={`${searchTerm ? `"${searchTerm}"에 대한 결과가 없습니다. ` : ''}${statusFilter !== 'ALL' ? `상태: ${getStatusFilterLabel(statusFilter)}` : ''}`}
              action={
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('ALL');
                    setCurrentPage(1);
                  }}
                  className="mt-2 typo-body2-heading text-primary hover:underline"
                >
                  필터 초기화
                </button>
              }
              className="h-60"
            />
          )}

          {/* 테스트 실행이 하나도 없을 때 */}
          {!hasError && testRuns.length === 0 && (
            <EmptyState
              icon={<ListTodo className="h-6 w-6" />}
              title="생성된 테스트 실행이 없습니다."
              description="새로운 테스트 실행을 생성하여 결과를 기록해보세요."
              action={
                <DSButton
                  variant="ghost"
                  className="mt-2 flex items-center gap-2"
                  onClick={() => router.push(`/projects/${projectSlug}/runs/create`)}
                >
                  <Plus className="h-4 w-4" />
                  테스트 실행 생성
                </DSButton>
              }
              className="h-60"
            />
          )}
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} className="mt-auto border-t border-line-2" />
        </section>
      </MainContainer>

      {/* 삭제 확인 다이얼로그 */}
      {deleteTarget && (
        <Dialog.Root defaultOpen onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
          <Dialog.Portal>
            <Dialog.Overlay />
            <Dialog.Content className="bg-bg-1 rounded-8 w-full max-w-md p-6 shadow-xl">
              <Dialog.Title className="text-lg font-semibold text-text-1">
                테스트 실행을 삭제하시겠습니까?
              </Dialog.Title>
              <Dialog.Description className="text-text-3 mt-3 text-sm">
                <strong className="text-text-1">&quot;{deleteTarget.name}&quot;</strong>과(와) 관련된 모든 테스트 케이스 실행 결과가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
              </Dialog.Description>
              <div className="mt-6 flex justify-end gap-3">
                <DSButton variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending}>
                  취소
                </DSButton>
                <DSButton
                  variant="solid"
                  className="bg-system-red hover:bg-system-red/90"
                  onClick={() => deleteMutation.mutate(deleteTarget.id)}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? '삭제 중...' : '삭제'}
                </DSButton>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </>
  );
};