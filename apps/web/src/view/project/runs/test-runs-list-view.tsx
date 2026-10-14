'use client';
import React, { useEffect, useMemo, useState } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { projectIdQueryOptions } from '@/entities/project';
import { dashboardQueryOptions } from '@/features/dashboard';
import { deleteTestRun, testRunsQueryOptions } from '@/features/runs';
import { useRerunRun } from '@/features/runs-edit';
import { TESTRUN_EVENTS, track } from '@/shared/lib/analytics';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MainContainer } from '@testea/ui';
import { toast } from 'sonner';

import { DeleteRunDialog } from './_components/delete-run-dialog';
import { RerunRunDialog } from './_components/rerun-run-dialog';
import type { ITestRun, RunListTab } from './_components/runs-list-constants';
import { RunsListLoadingSkeleton } from './_components/runs-list-loading-skeleton';
import { isRunOpen } from './_components/runs-list-model';
import { RunsListSummary } from './_components/runs-list-summary';
import { RunsListTable } from './_components/runs-list-table';
import { RunsListToolbar } from './_components/runs-list-toolbar';

const matchesTab = (run: ITestRun, tab: RunListTab) =>
  tab === 'ALL' || (tab === 'OPEN' ? isRunOpen(run) : !isRunOpen(run));

export const TestRunsListView = () => {
  const params = useParams();
  const router = useRouter();
  const projectSlug = params.slug as string;

  const [tab, setTab] = useState<RunListTab>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [milestoneFilter, setMilestoneFilter] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [deleteTargets, setDeleteTargets] = useState<ITestRun[]>([]);
  const [rerunTarget, setRerunTarget] = useState<ITestRun | null>(null);
  const queryClient = useQueryClient();

  // slug → projectId
  const { data: projectIdData } = useQuery(projectIdQueryOptions(projectSlug));
  const projectId = projectIdData?.success ? projectIdData.data.id : undefined;

  const {
    data: dashboardData,
    isLoading: isLoadingProject,
    refetch: refetchDashboard,
  } = useQuery(dashboardQueryOptions.stats(projectSlug));

  const {
    data: fetchedRunsData,
    isLoading: isLoadingRuns,
    refetch: refetchRuns,
  } = useQuery({
    ...testRunsQueryOptions(projectId!),
    enabled: !!projectId,
  });

  const testRuns = useMemo<ITestRun[]>(
    () => (fetchedRunsData?.success ? fetchedRunsData.data : []),
    [fetchedRunsData]
  );
  const hasError =
    (dashboardData && !dashboardData.success) || (fetchedRunsData && !fetchedRunsData.success);

  const deleteMutation = useMutation({
    mutationFn: async (runs: ITestRun[]) => {
      const results = await Promise.all(runs.map((run) => deleteTestRun(run.id)));
      return results.filter((result) => !result.success).length;
    },
    onSuccess: (failedCount, runs) => {
      const movedCount = runs.length - failedCount;
      if (movedCount > 0) toast.success(`테스트 실행 ${movedCount}개를 휴지통으로 옮겼습니다.`);
      if (failedCount > 0) toast.error(`${failedCount}개는 옮기지 못했습니다. 다시 시도해 주세요.`);
      queryClient.invalidateQueries({ queryKey: ['testRuns', projectId] });
      setSelectedIds(new Set());
      setDeleteTargets([]);
    },
    onError: () => {
      toast.error('휴지통으로 옮기는 중 오류가 발생했습니다.');
      setDeleteTargets([]);
    },
  });

  const rerunMutation = useRerunRun();

  const handleRerunConfirm = () => {
    if (!rerunTarget) return;
    rerunMutation.mutate(rerunTarget.id, {
      onSuccess: (result) => {
        toast.success('회귀 재실행이 생성되었습니다.');
        setRerunTarget(null);
        router.push(`/projects/${projectSlug}/runs/${result.testRun.id}`);
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : '회귀 재실행 생성에 실패했습니다.');
        setRerunTarget(null);
      },
    });
  };

  // 테스트 실행 목록 View 이벤트
  useEffect(() => {
    if (fetchedRunsData?.success) {
      track(TESTRUN_EVENTS.LIST_VIEW, { project_id: projectId });
    }
  }, [fetchedRunsData?.success, projectId]);

  const milestones = useMemo(
    () =>
      [
        ...new Set(testRuns.filter((r) => r.sourceType === 'MILESTONE').map((r) => r.sourceName)),
      ].sort((a, b) => a.localeCompare(b)),
    [testRuns]
  );

  // 탭을 뺀 조건(검색·마일스톤)으로 먼저 거르고, 탭 건수는 그 결과 기준으로 센다.
  const searchedRuns = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return testRuns.filter(
      (run) =>
        (term === '' ||
          run.name.toLowerCase().includes(term) ||
          run.sourceName.toLowerCase().includes(term)) &&
        (!milestoneFilter || (run.sourceType === 'MILESTONE' && run.sourceName === milestoneFilter))
    );
  }, [testRuns, searchTerm, milestoneFilter]);

  const tabCounts = useMemo(
    () => ({
      ALL: searchedRuns.length,
      OPEN: searchedRuns.filter(isRunOpen).length,
      COMPLETED: searchedRuns.filter((run) => !isRunOpen(run)).length,
    }),
    [searchedRuns]
  );

  const visibleRuns = useMemo(
    () => searchedRuns.filter((run) => matchesTab(run, tab)),
    [searchedRuns, tab]
  );

  // 탭·검색으로 보이지 않게 된 실행은 선택에서 뺀 것으로 본다.
  const visibleSelectedIds = useMemo(
    () => new Set(visibleRuns.filter((run) => selectedIds.has(run.id)).map((run) => run.id)),
    [visibleRuns, selectedIds]
  );

  const toggleSelect = (runId: string) =>
    setSelectedIds(() => {
      const next = new Set(visibleSelectedIds);
      if (next.has(runId)) next.delete(runId);
      else next.add(runId);
      return next;
    });

  const toggleSelectAll = () =>
    setSelectedIds(
      visibleSelectedIds.size === visibleRuns.length
        ? new Set()
        : new Set(visibleRuns.map((run) => run.id))
    );

  const handleResetFilters = () => {
    setSearchTerm('');
    setMilestoneFilter(null);
    setTab('ALL');
  };

  const handleCreateRun = () => {
    track(TESTRUN_EVENTS.CREATE_START, { project_id: projectId });
    router.push(`/projects/${projectSlug}/runs/create`);
  };

  if (isLoadingProject || (projectId && isLoadingRuns)) {
    return <RunsListLoadingSkeleton />;
  }

  return (
    <>
      <MainContainer className="mx-auto flex h-screen w-full max-w-[1280px] flex-1 flex-col overflow-y-auto px-4 pt-6 pb-5 md:px-12">
        <header className="flex items-center gap-3">
          <h2 className="text-[22px] font-bold whitespace-nowrap text-white/95">테스트 실행</h2>
          <span className="text-[15px] font-medium text-white/40">{testRuns.length}</span>
          <div className="flex-1" />
          <button
            type="button"
            onClick={handleCreateRun}
            className="bg-primary hover:bg-primary/90 rounded-[6px] px-4 py-[9px] text-[13px] font-bold whitespace-nowrap text-white transition-colors"
          >
            새 실행
          </button>
        </header>

        {testRuns.length > 0 && (
          <div className="mt-3.5">
            <RunsListSummary runs={testRuns} />
          </div>
        )}

        <div className="mt-3.5">
          <RunsListToolbar
            tab={tab}
            onTabChange={setTab}
            counts={tabCounts}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            milestones={milestones}
            milestoneFilter={milestoneFilter}
            onMilestoneFilterChange={setMilestoneFilter}
          />
        </div>

        <RunsListTable
          runs={visibleRuns}
          allRuns={testRuns}
          totalRunsCount={testRuns.length}
          hasError={!!hasError}
          isFiltered={searchTerm !== '' || milestoneFilter !== null || tab !== 'ALL'}
          selectedIds={visibleSelectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          onClearSelection={() => setSelectedIds(new Set())}
          onDeleteSelected={() =>
            setDeleteTargets(visibleRuns.filter((run) => visibleSelectedIds.has(run.id)))
          }
          onRunClick={(runId) => router.push(`/projects/${projectSlug}/runs/${runId}`)}
          onRerunClick={setRerunTarget}
          rerunPendingId={rerunMutation.isPending ? (rerunTarget?.id ?? null) : null}
          onRefetch={() => {
            refetchRuns();
            refetchDashboard();
          }}
          onResetFilters={handleResetFilters}
          onCreateRun={handleCreateRun}
        />
      </MainContainer>

      {deleteTargets.length > 0 && (
        <DeleteRunDialog
          targets={deleteTargets}
          isPending={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTargets)}
          onCancel={() => setDeleteTargets([])}
        />
      )}

      {rerunTarget && (
        <RerunRunDialog
          runName={rerunTarget.name}
          isPending={rerunMutation.isPending}
          onConfirm={handleRerunConfirm}
          onCancel={() => setRerunTarget(null)}
        />
      )}
    </>
  );
};
