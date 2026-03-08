'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { MainContainer } from '@/shared/lib/primitives';
import { Plus } from 'lucide-react';
import { DSButton } from '@/shared/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { projectIdQueryOptions } from '@/entities/project';
import { dashboardQueryOptions } from '@/features/dashboard';
import { testRunsQueryOptions, deleteTestRun } from '@/features/runs';
import { track, TESTRUN_EVENTS } from '@/shared/lib/analytics';
import { toast } from 'sonner';

import {
  type ITestRun,
  type RunStatusFilter,
  type RunSortOption,
  PAGE_SIZE,
} from './_components/runs-list-constants';
import { RunsListLoadingSkeleton } from './_components/runs-list-loading-skeleton';
import { RunsListToolbar } from './_components/runs-list-toolbar';
import { RunsListTable } from './_components/runs-list-table';
import { DeleteRunDialog } from './_components/delete-run-dialog';

export const TestRunsListView = () => {
  const params = useParams();
  const router = useRouter();
  const projectSlug = params.slug as string;

  // 검색어 상태
  const [searchTerm, setSearchTerm] = useState('');
  // 상태 필터
  const [statusFilter, setStatusFilter] = useState<RunStatusFilter>('ALL');
  // 정렬 옵션
  const [sortOption, setSortOption] = useState<RunSortOption>('UPDATED');
  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);
  // 드롭다운 열림 상태
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  // 삭제 확인 다이얼로그 상태
  const [deleteTarget, setDeleteTarget] = useState<ITestRun | null>(null);
  const queryClient = useQueryClient();

  // slug → projectId
  const { data: projectIdData } = useQuery(projectIdQueryOptions(projectSlug));
  const projectId = projectIdData?.success ? projectIdData.data.id : undefined;

  const { isLoading: isLoadingProject } = useQuery(
    dashboardQueryOptions.stats(projectSlug)
  );

  const { data: fetchedRunsData, isLoading: isLoadingRuns, refetch: refetchRuns } = useQuery({
    ...testRunsQueryOptions(projectId!),
    enabled: !!projectId,
  });

  const testRuns: ITestRun[] = (fetchedRunsData?.success ? fetchedRunsData.data : []) as ITestRun[];
  const { data: dashboardData } = useQuery(dashboardQueryOptions.stats(projectSlug));
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
    const matchesSearch =
      searchTerm === '' ||
      run.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      run.sourceName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || run.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 정렬 적용
  const sortedRuns = [...filteredRuns].sort((a, b) => {
    if (sortOption === 'NAME') return a.name.localeCompare(b.name);
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  // 페이지네이션 계산
  const totalPages = Math.ceil(sortedRuns.length / PAGE_SIZE);
  const paginatedRuns = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedRuns.slice(start, start + PAGE_SIZE);
  }, [sortedRuns, currentPage]);

  // Handlers
  const handleSearchChange = (value: string) => { setSearchTerm(value); setCurrentPage(1); };
  const handleStatusFilterChange = (value: RunStatusFilter) => { setStatusFilter(value); setIsStatusDropdownOpen(false); setCurrentPage(1); };
  const handleSortOptionChange = (value: RunSortOption) => { setSortOption(value); setIsSortDropdownOpen(false); };
  const handleStatusDropdownToggle = () => { setIsStatusDropdownOpen(prev => !prev); setIsSortDropdownOpen(false); };
  const handleSortDropdownToggle = () => { setIsSortDropdownOpen(prev => !prev); setIsStatusDropdownOpen(false); };
  const handleResetFilters = () => { setSearchTerm(''); setStatusFilter('ALL'); setCurrentPage(1); };
  const handleCreateRun = () => { track(TESTRUN_EVENTS.CREATE_START, { project_id: projectId }); router.push(`/projects/${projectSlug}/runs/create`); };
  const handleRunClick = (runId: string) => router.push(`/projects/${projectSlug}/runs/${runId}`);

  // 로딩 상태
  if (isLoadingProject || (projectId && isLoadingRuns)) {
    return <RunsListLoadingSkeleton />;
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
          <DSButton variant="solid" className="flex items-center gap-2" onClick={handleCreateRun}>
            <Plus className="h-4 w-4" />
            테스트 실행 생성
          </DSButton>
        </header>

        <RunsListToolbar
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
          sortOption={sortOption}
          onSortOptionChange={handleSortOptionChange}
          isSortDropdownOpen={isSortDropdownOpen}
          onSortDropdownToggle={handleSortDropdownToggle}
          onSortDropdownClose={() => setIsSortDropdownOpen(false)}
          isStatusDropdownOpen={isStatusDropdownOpen}
          onStatusDropdownToggle={handleStatusDropdownToggle}
          onStatusDropdownClose={() => setIsStatusDropdownOpen(false)}
        />

        <RunsListTable
          paginatedRuns={paginatedRuns}
          sortedRunsCount={sortedRuns.length}
          totalRunsCount={testRuns.length}
          hasError={!!hasError}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onRunClick={handleRunClick}
          onDeleteClick={setDeleteTarget}
          onRefetch={() => refetchRuns()}
          onResetFilters={handleResetFilters}
          onCreateRun={() => router.push(`/projects/${projectSlug}/runs/create`)}
        />
      </MainContainer>

      {deleteTarget && (
        <DeleteRunDialog
          deleteTarget={deleteTarget}
          isPending={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
};
