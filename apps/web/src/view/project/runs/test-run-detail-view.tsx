'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { MainContainer } from '@testea/ui';
import { useToggleSet, useSelectionSet, useOutsideClick } from '@/shared/hooks';
import { type TestStatusData } from '@/widgets/project';
import { testRunByIdQueryOptions, testRunsQueryOptions, updateTestCaseRunStatus, removeSuiteFromRun, updateTestRunName, bulkUpdateTestCaseRunStatus } from '@/features/runs';
import { dashboardQueryOptions } from '@/features/dashboard';
import { track, TESTRUN_EVENTS } from '@/shared/lib/analytics';
import { toast } from 'sonner';

import {
  RunDetailSkeleton, RunDetailError, RunDetailHeader, RunDetailCharts, RunSummaryBar,
  KeyboardShortcutsModal, RunCaseListPanel, RunCaseDetailPanel, RemoveSuiteDialog,
  useRunKeyboardShortcuts,
  type StatusFilter, type TestCaseRunStatus, type GroupedCases,
} from './_components';

// ─── Optimistic update helper ────────────────────────────────────

type ActionResultData<T> = { success: true; data: T } | { success: false; errors: Record<string, string[]> };
type TestRunQueryData = ActionResultData<import('@/entities/test-run').TestRunDetail>;

function applyOptimisticStatusUpdate(
  old: unknown,
  caseRunIds: string[],
  newStatus: string,
): TestRunQueryData {
  const data = old as TestRunQueryData;
  if (!data?.success) return data;

  const idsSet = new Set(caseRunIds);
  const updatedRuns = data.data.testCaseRuns.map(tc =>
    idsSet.has(tc.id) ? { ...tc, status: newStatus as TestCaseRunStatus } : tc
  );

  const stats = { total: updatedRuns.length, pass: 0, fail: 0, blocked: 0, untested: 0, progressPercent: 0 };
  for (const tc of updatedRuns) {
    if (tc.status in stats) stats[tc.status as keyof typeof stats]++;
  }
  stats.progressPercent = stats.total > 0 ? Math.round(((stats.total - stats.untested) / stats.total) * 100) : 0;

  return { ...data, data: { ...data.data, testCaseRuns: updatedRuns, stats } };
}

// ─── Main Orchestrator ───────────────────────────────────────────

export const TestRunDetailView = () => {
  const params = useParams();
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
  const [removeSuiteTarget, setRemoveSuiteTarget] = useState<{ id: string; name: string } | null>(null);
  const [showStatusFilterDropdown, setShowStatusFilterDropdown] = useState(false);
  const [showSuiteFilterDropdown, setShowSuiteFilterDropdown] = useState(false);
  const statusFilterRef = React.useRef<HTMLDivElement>(null);
  const suiteFilterRef = React.useRef<HTMLDivElement>(null);

  useOutsideClick(statusFilterRef, () => setShowStatusFilterDropdown(false), showStatusFilterDropdown);
  useOutsideClick(suiteFilterRef, () => setShowSuiteFilterDropdown(false), showSuiteFilterDropdown);

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
    onError: (_err, _input, context) => {
      if (context?.previous) queryClient.setQueryData(['testRun', testRunId], context.previous);
      toast.error('상태 변경 중 오류가 발생했습니다.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['testRun', testRunId] });
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
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`${result.data.updatedCount}개 케이스 상태가 변경되었습니다.`);
        bulkSelection.clear();
      } else {
        toast.error(Object.values(result.errors).flat().join(', '));
      }
    },
    onError: (_err, _input, context) => {
      if (context?.previous) queryClient.setQueryData(['testRun', testRunId], context.previous);
      toast.error('일괄 상태 변경 중 오류가 발생했습니다.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['testRun', testRunId] });
      if (projectId) queryClient.invalidateQueries({ queryKey: ['testRuns', projectId] });
    },
  });

  // ─── Derived Data ──────────────────────────────────────────────
  const testRun = data?.success ? data.data : null;

  const testStatusData: TestStatusData = useMemo(() => {
    if (!testRun) return { pass: 0, fail: 0, blocked: 0, untested: 0 };
    return { pass: testRun.stats.pass, fail: testRun.stats.fail, blocked: testRun.stats.blocked, untested: testRun.stats.untested };
  }, [testRun]);

  const availableSuites = useMemo(() => {
    if (!testRun?.testCaseRuns) return [];
    const suiteMap = new Map<string, string>();
    for (const tc of testRun.testCaseRuns) {
      if (tc.testSuiteId && tc.testSuiteName) suiteMap.set(tc.testSuiteId, tc.testSuiteName);
    }
    return Array.from(suiteMap.entries()).map(([id, name]) => ({ id, name }));
  }, [testRun]);

  const filteredCases = useMemo(() => {
    if (!testRun) return [];
    return testRun.testCaseRuns.filter((tc) => {
      const matchesSearch = tc.title.toLowerCase().includes(searchQuery.toLowerCase()) || tc.code.toLowerCase().includes(searchQuery.toLowerCase());
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
      if (!groups.has(key)) groups.set(key, { groupKey: key, suiteId: tc.testSuiteId, suiteName, cases: [] });
      groups.get(key)!.cases.push(tc);
    }
    return Array.from(groups.values()).sort((a, b) => {
      if (!a.suiteId && b.suiteId) return 1;
      if (a.suiteId && !b.suiteId) return -1;
      return a.suiteName.localeCompare(b.suiteName);
    });
  }, [testRun, filteredCases]);

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
    if (!selectedCaseId && filteredCases.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- legitimate initial sync
      setSelectedCaseId(filteredCases[0].id);
    }
  }, [filteredCases, selectedCaseId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing editable state from selected case
    setComment(selectedCase?.comment || '');
  }, [selectedCase]);

  // ─── Handlers ──────────────────────────────────────────────────
  const handleInlineStatusChange = useCallback((caseId: string, status: TestCaseRunStatus) => {
    updateMutation.mutate({ testCaseRunId: caseId, status, comment: null });
  }, [updateMutation]);

  const handleBulkStatusChange = useCallback((status: TestCaseRunStatus) => {
    if (bulkSelection.count === 0) return;
    bulkUpdateMutation.mutate({ testCaseRunIds: bulkSelection.toArray(), status });
  }, [bulkSelection, bulkUpdateMutation]);

  const handleStatusChange = useCallback((status: TestCaseRunStatus) => {
    if (!selectedCase) return;
    track(TESTRUN_EVENTS.RESULT_UPDATE, { status, case_id: selectedCase.id });
    updateMutation.mutate({ testCaseRunId: selectedCase.id, status, comment: comment || null });

    const currentIndex = filteredCases.findIndex((tc) => tc.id === selectedCase.id);
    const nextUntested = filteredCases.find((tc, i) => i > currentIndex && tc.status === 'untested');
    if (nextUntested) {
      setSelectedCaseId(nextUntested.id);
    } else {
      const nextCase = filteredCases[currentIndex + 1];
      if (nextCase) setSelectedCaseId(nextCase.id);
    }
  }, [selectedCase, comment, filteredCases, updateMutation]);

  // ─── Keyboard Shortcuts ────────────────────────────────────────
  useRunKeyboardShortcuts({
    selectedCaseId,
    filteredCases,
    onStatusChange: handleStatusChange,
    onSelectCase: setSelectedCaseId,
    onToggleShortcuts: useCallback(() => setShowShortcuts(prev => !prev), []),
  });

  // ─── Render ────────────────────────────────────────────────────
  if (isLoading) return <RunDetailSkeleton />;
  if (isError || !testRun) return <RunDetailError projectSlug={projectSlug} />;

  return (
    <MainContainer className="flex flex-1 flex-col min-h-screen overflow-x-hidden">
      <RunDetailHeader
        testRun={testRun}
        projectSlug={projectSlug}
        testRunId={testRunId}
        onRename={(name) => renameMutation.mutate({ name })}
        isRenaming={renameMutation.isPending}
        onShowShortcuts={() => setShowShortcuts(true)}
        showCharts={showCharts}
        onToggleCharts={() => setShowCharts(prev => !prev)}
      />

      <RunSummaryBar stats={testRun.stats} />

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
      <div className="sticky top-0 flex flex-1 overflow-hidden">
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
          showStatusFilterDropdown={showStatusFilterDropdown}
          setShowStatusFilterDropdown={setShowStatusFilterDropdown}
          showSuiteFilterDropdown={showSuiteFilterDropdown}
          setShowSuiteFilterDropdown={setShowSuiteFilterDropdown}
          statusFilterRef={statusFilterRef}
          suiteFilterRef={suiteFilterRef}
          onRemoveSuite={(suiteId, suiteName) => setRemoveSuiteTarget({ id: suiteId, name: suiteName })}
          bulkSelection={bulkSelection}
          filteredCaseIds={filteredCases.map(c => c.id)}
          onBulkStatusChange={handleBulkStatusChange}
          isBulkUpdating={bulkUpdateMutation.isPending}
          onInlineStatusChange={handleInlineStatusChange}
        />

        <RunCaseDetailPanel
          selectedCase={selectedCase}
          filteredCases={filteredCases}
          selectedCaseId={selectedCaseId}
          setSelectedCaseId={setSelectedCaseId}
          comment={comment}
          setComment={setComment}
          handleStatusChange={handleStatusChange}
          updateMutation={updateMutation}
        />
      </div>

      <KeyboardShortcutsModal
        open={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      {removeSuiteTarget && (
        <RemoveSuiteDialog
          target={removeSuiteTarget}
          isPending={removeSuiteMutation.isPending}
          onConfirm={(suiteId) => removeSuiteMutation.mutate({ suiteId })}
          onClose={() => setRemoveSuiteTarget(null)}
        />
      )}
    </MainContainer>
  );
};
