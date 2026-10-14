'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { getTestCases } from '@/entities/test-case/api';
import { getTestSuites } from '@/entities/test-suite/api';
import { dashboardQueryOptions } from '@/features/dashboard';
import {
  bulkUpdateTestCaseRunStatus,
  removeSuiteFromRun,
  testRunByIdQueryOptions,
  testRunsQueryOptions,
  updateTestCaseRunStatus,
  updateTestRunName,
} from '@/features/runs';
import { AddToRunModal, useRerunRun } from '@/features/runs-edit';
import { TESTRUN_EVENTS, track } from '@/shared/lib/analytics';
import { type TestStatusData } from '@/widgets/project';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelectionSet, useToggleSet } from '@testea/lib';
import { MainContainer } from '@testea/ui';
import { toast } from 'sonner';

import {
  AutoRunDialog,
  type GroupedCases,
  KeyboardShortcutsModal,
  RemoveSuiteDialog,
  RerunRunDialog,
  RunCaseDetailPanel,
  RunCaseListPanel,
  RunDetailCharts,
  RunDetailError,
  RunDetailHeader,
  RunDetailSkeleton,
  RunSummaryBar,
  type StatusFilter,
  type TestCaseRunStatus,
  useRunKeyboardShortcuts,
} from './_components';

// ─── Optimistic update helper ────────────────────────────────────

type ActionResultData<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string[]> };
type TestRunQueryData = ActionResultData<import('@/entities/test-run').TestRunDetail>;

function applyOptimisticStatusUpdate(
  old: unknown,
  caseRunIds: string[],
  newStatus: string
): TestRunQueryData {
  const data = old as TestRunQueryData;
  if (!data?.success) return data;

  const idsSet = new Set(caseRunIds);
  const updatedRuns = data.data.testCaseRuns.map((tc) =>
    idsSet.has(tc.id) ? { ...tc, status: newStatus as TestCaseRunStatus } : tc
  );

  const stats = {
    total: updatedRuns.length,
    pass: 0,
    fail: 0,
    blocked: 0,
    untested: 0,
    progressPercent: 0,
  };
  for (const tc of updatedRuns) {
    if (tc.status in stats) stats[tc.status as keyof typeof stats]++;
  }
  stats.progressPercent =
    stats.total > 0 ? Math.round(((stats.total - stats.untested) / stats.total) * 100) : 0;

  return { ...data, data: { ...data.data, testCaseRuns: updatedRuns, stats } };
}

// ─── Main Orchestrator ───────────────────────────────────────────

export const TestRunDetailView = () => {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const testRunId = params.testRunId as string;
  const projectSlug = params.slug as string;

  // ─── UI State ──────────────────────────────────────────────────
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [suiteFilter, setSuiteFilter] = useState<string>('all');
  const collapsedGroups = useToggleSet();
  const bulkSelection = useSelectionSet();
  const [comment, setComment] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [removeSuiteTarget, setRemoveSuiteTarget] = useState<{ id: string; name: string } | null>(
    null
  );
  const [showRerunDialog, setShowRerunDialog] = useState(false);
  const [showAutoRunDialog, setShowAutoRunDialog] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // ─── Data Fetching ─────────────────────────────────────────────
  const { data, isLoading, isError } = useQuery(testRunByIdQueryOptions(testRunId));

  const { data: dashboardData } = useQuery({
    ...dashboardQueryOptions.stats(projectSlug),
    enabled: !!projectSlug,
  });
  const projectId = dashboardData?.success ? dashboardData.data.project.id : undefined;

  const { data: testRunsData } = useQuery({
    ...testRunsQueryOptions(projectId!),
    enabled: !!projectId,
  });
  const allTestRuns = testRunsData?.success ? testRunsData.data : [];

  const { data: milestonesData } = useQuery({
    ...dashboardQueryOptions.milestones(projectId!, testRunId),
    enabled: !!projectId,
  });
  const dashboardMilestones = milestonesData?.success ? milestonesData.data : [];

  // 테스트 추가 모달 후보. 모달을 열 때만 불러온다 (#375).
  const { data: projectCasesData } = useQuery({
    queryKey: ['testCases', 'forRunAdd', projectId],
    queryFn: () => getTestCases({ project_id: projectId! }),
    enabled: showAddModal && !!projectId,
  });
  const { data: projectSuitesData } = useQuery({
    queryKey: ['testSuites', 'forRunAdd', projectId],
    queryFn: () => getTestSuites({ projectId: projectId! }),
    enabled: showAddModal && !!projectId,
  });

  // ─── Mutations ─────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: updateTestCaseRunStatus,
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['testRun', testRunId] });
      const previous = queryClient.getQueryData(['testRun', testRunId]);
      queryClient.setQueryData(['testRun', testRunId], (old: unknown) =>
        applyOptimisticStatusUpdate(old, [input.testCaseRunId], input.status)
      );
      return { previous };
    },
    onSuccess: (result, _input, context) => {
      // 서버가 거부한 변경(예: 삭제된 실행, #419)은 낙관적 표시를 되돌리고 이유를 알린다.
      if (result.success) return;
      if (context?.previous) queryClient.setQueryData(['testRun', testRunId], context.previous);
      toast.error(Object.values(result.errors).flat().join(', '));
    },
    onError: (_err, _input, context) => {
      if (context?.previous) queryClient.setQueryData(['testRun', testRunId], context.previous);
      toast.error('상태 변경 중 오류가 발생했습니다.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['testRun', testRunId] });
      // 케이스 목록의 상태는 마지막 실행 결과라 결과가 바뀌면 같이 다시 불러온다 (#379).
      queryClient.invalidateQueries({ queryKey: ['testCases'] });
    },
  });

  const removeSuiteMutation = useMutation({
    mutationFn: ({ suiteId }: { suiteId: string }) => removeSuiteFromRun({ testRunId, suiteId }),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`스위트가 제거되었습니다. (${result.data.excluded}건 제외)`);
        queryClient.invalidateQueries({ queryKey: ['testRun', testRunId] });
        if (projectId) queryClient.invalidateQueries({ queryKey: ['testRuns', projectId] });
      } else {
        toast.error(Object.values(result.errors).flat().join(', '));
      }
      setRemoveSuiteTarget(null);
    },
    onError: () => {
      toast.error('스위트 제거 중 오류가 발생했습니다.');
      setRemoveSuiteTarget(null);
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ name }: { name: string }) => updateTestRunName(testRunId, name),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('제목이 변경되었습니다.');
        queryClient.invalidateQueries({ queryKey: ['testRun', testRunId] });
        if (projectId) queryClient.invalidateQueries({ queryKey: ['testRuns', projectId] });
      } else {
        toast.error(Object.values(result.errors).flat().join(', '));
      }
    },
    onError: () => {
      toast.error('제목 변경 중 오류가 발생했습니다.');
    },
  });

  const rerunMutation = useRerunRun();

  const handleRerunConfirm = useCallback(() => {
    rerunMutation.mutate(testRunId, {
      onSuccess: (result) => {
        toast.success('회귀 재실행이 생성되었습니다.');
        setShowRerunDialog(false);
        router.push(`/projects/${projectSlug}/runs/${result.testRun.id}`);
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : '회귀 재실행 생성에 실패했습니다.');
        setShowRerunDialog(false);
      },
    });
  }, [rerunMutation, testRunId, router, projectSlug]);

  const bulkUpdateMutation = useMutation({
    mutationFn: bulkUpdateTestCaseRunStatus,
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['testRun', testRunId] });
      const previous = queryClient.getQueryData(['testRun', testRunId]);
      queryClient.setQueryData(['testRun', testRunId], (old: unknown) =>
        applyOptimisticStatusUpdate(old, input.testCaseRunIds, input.status)
      );
      return { previous };
    },
    onSuccess: (result, _input, context) => {
      if (result.success) {
        toast.success(`${result.data.updatedCount}개 케이스 상태가 변경되었습니다.`);
        bulkSelection.clear();
      } else {
        if (context?.previous) queryClient.setQueryData(['testRun', testRunId], context.previous);
        toast.error(Object.values(result.errors).flat().join(', '));
      }
    },
    onError: (_err, _input, context) => {
      if (context?.previous) queryClient.setQueryData(['testRun', testRunId], context.previous);
      toast.error('일괄 상태 변경 중 오류가 발생했습니다.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['testRun', testRunId] });
      // 케이스 목록의 상태는 마지막 실행 결과라 결과가 바뀌면 같이 다시 불러온다 (#379).
      queryClient.invalidateQueries({ queryKey: ['testCases'] });
      if (projectId) queryClient.invalidateQueries({ queryKey: ['testRuns', projectId] });
    },
  });

  // ─── Derived Data ──────────────────────────────────────────────
  const testRun = data?.success ? data.data : null;

  const testStatusData: TestStatusData = useMemo(() => {
    if (!testRun) return { pass: 0, fail: 0, blocked: 0, untested: 0 };
    return {
      pass: testRun.stats.pass,
      fail: testRun.stats.fail,
      blocked: testRun.stats.blocked,
      untested: testRun.stats.untested,
    };
  }, [testRun]);

  const availableSuites = useMemo(() => {
    if (!testRun?.testCaseRuns) return [];
    const suiteMap = new Map<string, string>();
    for (const tc of testRun.testCaseRuns) {
      if (tc.testSuiteId && tc.testSuiteName) suiteMap.set(tc.testSuiteId, tc.testSuiteName);
    }
    return Array.from(suiteMap.entries()).map(([id, name]) => ({ id, name }));
  }, [testRun]);

  // 실행에 직접 연결된 스위트. 이 스위트 그룹에만 제거 버튼을 보인다 (#375).
  const removableSuiteIds = useMemo(
    () => new Set(testRun?.sources.filter((s) => s.type === 'suite').map((s) => s.id) ?? []),
    [testRun]
  );

  const addableCases = useMemo(() => {
    if (!testRun || !projectCasesData?.success) return [];
    const inRun = new Set(testRun.testCaseRuns.map((tc) => tc.testCaseId));
    return (projectCasesData.data ?? []).filter((tc) => !inRun.has(tc.id));
  }, [testRun, projectCasesData]);

  const addableSuites = useMemo(() => {
    if (!projectSuitesData?.success) return [];
    return (projectSuitesData.data ?? []).filter((suite) => !removableSuiteIds.has(suite.id));
  }, [projectSuitesData, removableSuiteIds]);

  const filteredCases = useMemo(() => {
    if (!testRun) return [];
    return testRun.testCaseRuns.filter((tc) => {
      const matchesSearch =
        tc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tc.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || tc.status === statusFilter;
      const matchesSuite = suiteFilter === 'all' || tc.testSuiteId === suiteFilter;
      return matchesSearch && matchesStatus && matchesSuite;
    });
  }, [testRun, searchQuery, statusFilter, suiteFilter]);

  const groupedCases = useMemo((): GroupedCases[] => {
    if (!testRun) return [];
    const groups = new Map<string, GroupedCases>();
    for (const tc of filteredCases) {
      const key = tc.testSuiteId || '__unclassified__';
      const suiteName = tc.testSuiteName || '미분류';
      if (!groups.has(key))
        groups.set(key, { groupKey: key, suiteId: tc.testSuiteId, suiteName, cases: [] });
      groups.get(key)!.cases.push(tc);
    }
    return Array.from(groups.values()).sort((a, b) => {
      if (!a.suiteId && b.suiteId) return 1;
      if (a.suiteId && !b.suiteId) return -1;
      return a.suiteName.localeCompare(b.suiteName);
    });
  }, [testRun, filteredCases]);

  // 화면에 보이는 순서(스위트 묶음 순). 첫 선택, 다음 케이스, J/K 이동이 모두 이 순서를 따른다.
  const orderedCases = useMemo(() => groupedCases.flatMap((g) => g.cases), [groupedCases]);

  const selectedCase = useMemo(() => {
    if (!selectedCaseId || !testRun) return null;
    return testRun.testCaseRuns.find((tc) => tc.id === selectedCaseId) || null;
  }, [selectedCaseId, testRun]);

  // ─── Analytics ─────────────────────────────────────────────────
  useEffect(() => {
    if (testRun) {
      track(TESTRUN_EVENTS.DETAIL_VIEW, { run_id: testRunId, project_slug: projectSlug });
    }
  }, [testRun, testRunId, projectSlug]);

  // ─── Side Effects ──────────────────────────────────────────────
  useEffect(() => {
    if (!selectedCaseId && orderedCases.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- legitimate initial sync
      setSelectedCaseId(orderedCases[0].id);
    }
  }, [orderedCases, selectedCaseId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing editable state from selected case
    setComment(selectedCase?.comment || '');
  }, [selectedCase]);

  // ─── Handlers ──────────────────────────────────────────────────
  const handleInlineStatusChange = useCallback(
    (caseId: string, status: TestCaseRunStatus) => {
      // 상태만 바꾼다. 코멘트를 보내지 않아야 저장된 코멘트가 남는다 (#413).
      updateMutation.mutate({ testCaseRunId: caseId, status });
    },
    [updateMutation]
  );

  const handleBulkStatusChange = useCallback(
    (status: TestCaseRunStatus) => {
      if (bulkSelection.count === 0) return;
      bulkUpdateMutation.mutate({ testCaseRunIds: bulkSelection.toArray(), status });
    },
    [bulkSelection, bulkUpdateMutation]
  );

  const handleStatusChange = useCallback(
    (status: TestCaseRunStatus) => {
      if (!selectedCase) return;
      track(TESTRUN_EVENTS.RESULT_UPDATE, { status, case_id: selectedCase.id });
      updateMutation.mutate({ testCaseRunId: selectedCase.id, status, comment: comment || null });

      const currentIndex = orderedCases.findIndex((tc) => tc.id === selectedCase.id);
      const nextUntested = orderedCases.find(
        (tc, i) => i > currentIndex && tc.status === 'untested'
      );
      if (nextUntested) {
        setSelectedCaseId(nextUntested.id);
      } else {
        const nextCase = orderedCases[currentIndex + 1];
        if (nextCase) setSelectedCaseId(nextCase.id);
      }
    },
    [selectedCase, comment, orderedCases, updateMutation]
  );

  // ─── Keyboard Shortcuts ────────────────────────────────────────
  useRunKeyboardShortcuts({
    selectedCaseId,
    filteredCases: orderedCases,
    onStatusChange: handleStatusChange,
    onSelectCase: setSelectedCaseId,
    onToggleShortcuts: useCallback(() => setShowShortcuts((prev) => !prev), []),
  });

  // ─── Render ────────────────────────────────────────────────────
  if (isLoading) return <RunDetailSkeleton />;
  if (isError || !testRun) return <RunDetailError projectSlug={projectSlug} />;

  return (
    <MainContainer className="flex h-screen min-h-0 flex-1 flex-col overflow-hidden">
      <div className="border-line-2 flex shrink-0 flex-col gap-3 border-b px-4 pt-[18px] pb-4 md:px-8">
        <RunDetailHeader
          testRun={testRun}
          projectSlug={projectSlug}
          testRunId={testRunId}
          onRename={(name) => renameMutation.mutate({ name })}
          isRenaming={renameMutation.isPending}
          onShowShortcuts={() => setShowShortcuts(true)}
          showCharts={showCharts}
          onToggleCharts={() => setShowCharts((prev) => !prev)}
          onRerun={() => setShowRerunDialog(true)}
          isRerunning={rerunMutation.isPending}
          onAutoRun={() => setShowAutoRunDialog(true)}
          onAddTests={() => setShowAddModal(true)}
        />

        <RunSummaryBar stats={testRun.stats} />
      </div>

      {/* Collapsible charts panel */}
      {showCharts && (
        <RunDetailCharts
          testStatusData={testStatusData}
          milestones={dashboardMilestones}
          testRuns={allTestRuns}
          selectedRunId={testRunId}
        />
      )}

      {/* Main Content - full height work area */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <RunCaseListPanel
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          suiteFilter={suiteFilter}
          setSuiteFilter={setSuiteFilter}
          availableSuites={availableSuites}
          filteredCases={filteredCases}
          groupedCases={groupedCases}
          collapsedGroups={collapsedGroups}
          selectedCaseId={selectedCaseId}
          setSelectedCaseId={setSelectedCaseId}
          testRunStats={testRun.stats}
          onRemoveSuite={(suiteId, suiteName) =>
            setRemoveSuiteTarget({ id: suiteId, name: suiteName })
          }
          removableSuiteIds={removableSuiteIds}
          bulkSelection={bulkSelection}
          filteredCaseIds={orderedCases.map((c) => c.id)}
          onBulkStatusChange={handleBulkStatusChange}
          isBulkUpdating={bulkUpdateMutation.isPending}
          onInlineStatusChange={handleInlineStatusChange}
        />

        <RunCaseDetailPanel
          selectedCase={selectedCase}
          filteredCases={orderedCases}
          selectedCaseId={selectedCaseId}
          setSelectedCaseId={setSelectedCaseId}
          comment={comment}
          setComment={setComment}
          handleStatusChange={handleStatusChange}
          updateMutation={updateMutation}
        />
      </div>

      <KeyboardShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />

      {removeSuiteTarget && (
        <RemoveSuiteDialog
          target={removeSuiteTarget}
          isPending={removeSuiteMutation.isPending}
          onConfirm={(suiteId) => removeSuiteMutation.mutate({ suiteId })}
          onClose={() => setRemoveSuiteTarget(null)}
        />
      )}

      {showAddModal && (
        <AddToRunModal
          runId={testRunId}
          availableCases={addableCases}
          availableSuites={addableSuites}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {showRerunDialog && (
        <RerunRunDialog
          runName={testRun.name}
          isPending={rerunMutation.isPending}
          onConfirm={handleRerunConfirm}
          onCancel={() => setShowRerunDialog(false)}
        />
      )}

      {showAutoRunDialog && (
        <AutoRunDialog
          projectId={projectId}
          projectSlug={projectSlug}
          runId={testRunId}
          cases={testRun.testCaseRuns.map((tc) => ({
            testCaseId: tc.testCaseId,
            code: tc.code,
            title: tc.title,
          }))}
          initialCaseId={selectedCaseId ?? undefined}
          onClose={() => setShowAutoRunDialog(false)}
        />
      )}
    </MainContainer>
  );
};
