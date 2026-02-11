'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Container, MainContainer, LoadingSpinner } from '@/shared';
import { Aside } from '@/widgets';
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
  Plus
} from 'lucide-react';
import { DSButton } from '@/shared/ui';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { dashboardQueryOptions } from '@/features/dashboard';
import { testRunsQueryOptions } from '@/features/runs';
import { track, TESTRUN_EVENTS } from '@/shared/lib/analytics';

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
  // 드롭다운 열림 상태
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // 드롭다운 외부 클릭 감지를 위한 ref
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: dashboardData, isLoading: isLoadingProject } = useQuery(
    dashboardQueryOptions.stats(projectSlug)
  );

  const projectId = dashboardData?.success ? dashboardData.data.project.id : undefined;

  const { data: fetchedRunsData, isLoading: isLoadingRuns } = useQuery({
    ...testRunsQueryOptions(projectId!),
    enabled: !!projectId,
  });

  const testRuns: ITestRun[] = (fetchedRunsData?.success ? fetchedRunsData.data : []) as ITestRun[];

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
  const clearSearch = () => setSearchTerm('');

  const getStatusBadgeStyle = (status: RunStatus) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-primary/10 text-primary';
      case 'IN_PROGRESS':
        return 'bg-system-blue/10 text-system-blue';
      case 'NOT_STARTED':
      default:
        return 'bg-bg-4 text-text-3';
    }
  };

  const getStatusLabel = (status: RunStatus) => {
    switch (status) {
      case 'COMPLETED': return 'Completed';
      case 'IN_PROGRESS': return 'In Progress';
      case 'NOT_STARTED': return 'Not Started';
    }
  };

  const getSourceIcon = (type: RunSourceType) => {
    switch(type) {
      case 'SUITE': return <ListTodo className="h-3.5 w-3.5" />;
      case 'MILESTONE': return <Clock className="h-3.5 w-3.5" />;
      default: return <PlayCircle className="h-3.5 w-3.5" />;
    }
  };

  if (isLoadingProject || (projectId && isLoadingRuns)) {
    return (
      <Container className="bg-bg-1 text-text-1 flex min-h-screen items-center justify-center font-sans">
        <Aside />
        <MainContainer className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </MainContainer>
      </Container>
    );
  }

  return (
    <Container className="bg-bg-1 text-text-1 flex min-h-screen font-sans">
      <Aside />

      <MainContainer className="grid min-h-screen w-full flex-1 grid-cols-6 content-start gap-x-5 gap-y-8 py-8 max-w-[1200px] mx-auto px-10">
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
                onChange={(e) => setSearchTerm(e.target.value)}
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

        {/* 검색 결과 요약 */}
        {(searchTerm || statusFilter !== 'ALL') && (
          <div className="col-span-6 flex items-center gap-2 text-text-3">
            <span className="typo-body2-normal">
              {sortedRuns.length}개 결과
              {searchTerm && <span className="ml-1">· 검색어: &quot;{searchTerm}&quot;</span>}
              {statusFilter !== 'ALL' && <span className="ml-1">· 상태: {getStatusFilterLabel(statusFilter)}</span>}
            </span>
          </div>
        )}

        <section className="col-span-6 flex flex-col overflow-hidden rounded-4 border border-line-2 bg-bg-2 shadow-1">
          <div className="grid grid-cols-12 gap-4 border-b border-line-2 bg-bg-3 px-6 py-3">
            <div className="col-span-5 typo-caption-heading text-text-3 uppercase">실행 이름 / 기준</div>
            <div className="col-span-3 typo-caption-heading text-text-3 uppercase">진행률 (완료/전체)</div>
            <div className="col-span-2 text-center typo-caption-heading text-text-3 uppercase">상태</div>
            <div className="col-span-2 text-right typo-caption-heading text-text-3 uppercase">마지막 업데이트</div>
          </div>

          {sortedRuns.map((run) => {
            const { totalCases, completedCases, progressPercent } = run.stats;

            return (
              <div
                key={run.id}
                onClick={() => router.push(`/projects/${projectSlug}/runs/${run.id}`)}
                className="group grid cursor-pointer grid-cols-12 items-center gap-4 border-b border-line-2 px-6 py-5 transition-colors hover:bg-bg-3 last:border-b-0"
              >
                <div className="col-span-5 flex flex-col gap-1.5">
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

                <div className="col-span-3 flex flex-col gap-2 pr-4">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-text-1">{progressPercent}%</span>
                    <span className="text-text-3">{completedCases} / {totalCases}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-bg-4">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        run.status === 'COMPLETED' ? 'bg-primary' : 'bg-system-blue'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="col-span-2 flex justify-center">
                  <span className={`typo-caption-heading inline-flex items-center rounded-1 px-2.5 py-1 ${getStatusBadgeStyle(run.status)}`}>
                    {run.status === 'COMPLETED' && <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
                    {run.status === 'IN_PROGRESS' && <PlayCircle className="mr-1.5 h-3.5 w-3.5" />}
                    {getStatusLabel(run.status)}
                  </span>
                </div>

                <div className="col-span-2 text-right">
                  <span className="typo-caption-normal text-text-3">
                    {new Date(run.updatedAt).toLocaleDateString()}
                  </span>
                  <div className="typo-caption-normal text-text-4">
                    {new Date(run.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}

          {/* 검색/필터 결과가 없을 때 */}
          {testRuns.length > 0 && sortedRuns.length === 0 && (
            <div className="flex h-60 flex-col items-center justify-center gap-2 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-3 text-text-3">
                <Search className="h-6 w-6" />
              </div>
              <p className="typo-body1-heading text-text-2">검색 결과가 없습니다.</p>
              <p className="typo-caption-normal text-text-3">
                {searchTerm && `"${searchTerm}"에 대한 결과가 없습니다. `}
                {statusFilter !== 'ALL' && `상태: ${getStatusFilterLabel(statusFilter)}`}
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                }}
                className="mt-2 typo-body2-heading text-primary hover:underline"
              >
                필터 초기화
              </button>
            </div>
          )}

          {/* 테스트 실행이 하나도 없을 때 */}
          {testRuns.length === 0 && (
            <div className="flex h-60 flex-col items-center justify-center gap-2 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-3 text-text-3">
                <ListTodo className="h-6 w-6" />
              </div>
              <p className="typo-body1-heading text-text-2">생성된 테스트 실행이 없습니다.</p>
              <p className="typo-caption-normal text-text-3">새로운 테스트 실행을 생성하여 결과를 기록해보세요.</p>
              <DSButton
                variant="ghost"
                className="mt-2 flex items-center gap-2"
                onClick={() => router.push(`/projects/${projectSlug}/runs/create`)}
              >
                <Plus className="h-4 w-4" />
                테스트 실행 생성
              </DSButton>
            </div>
          )}
        </section>
      </MainContainer>
    </Container>
  );
};