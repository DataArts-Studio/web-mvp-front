'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';

import { MainContainer } from '@/shared/lib/primitives';
import { Dialog } from '@/shared/lib/primitives/dialog/dialog';
import { DSButton } from '@/shared/ui';
import { RUN_STATUS_CONFIG } from '@/shared/ui';
import { cn } from '@/shared/utils';
import { useOutsideClick, useToggleSet } from '@/shared/hooks';
import { type TestStatusData } from '@/widgets/project';
import { testRunByIdQueryOptions, testRunsQueryOptions, updateTestCaseRunStatus, removeSuiteFromRun, updateTestRunName, bulkUpdateTestCaseRunStatus } from '@/features/runs';
import { dashboardQueryOptions } from '@/features/dashboard';
import { track, TESTRUN_EVENTS } from '@/shared/lib/analytics';
import { ShareButton } from '@/features/runs-share/ui/share-button';
import { ArrowLeft, XCircle, Keyboard, Pencil, Check, X, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

import {
  STATUS_CONFIG, SOURCE_TYPE_CONFIG,
  RunDetailSkeleton, KeyboardShortcutsModal, RunCaseListPanel, RunCaseDetailPanel,
  type StatusFilter, type TestCaseRunStatus, type GroupedCases,
} from './_components';

const TestStatusChart = dynamic(
  () => import('@/widgets/project/ui/test-status-chart').then(mod => ({ default: mod.TestStatusChart })),
  { ssr: false, loading: () => <div className="bg-bg-2 rounded-[16px] p-6 h-[400px] animate-pulse" /> }
);
const MilestoneGanttChart = dynamic(
  () => import('@/widgets/project/ui/milestone-gantt-chart').then(mod => ({ default: mod.MilestoneGanttChart })),
  { ssr: false, loading: () => <div className="bg-bg-2 rounded-[16px] p-6 h-[300px] animate-pulse" /> }
);

export const TestRunDetailView = () => {
  const params = useParams();
  const queryClient = useQueryClient();
  const testRunId = params.testRunId as string;
  const projectSlug = params.slug as string;

  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [suiteFilter, setSuiteFilter] = useState<string>('all');
  const collapsedGroups = useToggleSet();
  const [comment, setComment] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [removeSuiteTarget, setRemoveSuiteTarget] = useState<{ id: string; name: string } | null>(null);
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const sourceDropdownRef = useRef<HTMLDivElement>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showStatusFilterDropdown, setShowStatusFilterDropdown] = useState(false);
  const [showSuiteFilterDropdown, setShowSuiteFilterDropdown] = useState(false);
  const [selectedCaseIds, setSelectedCaseIds] = useState<Set<string>>(new Set());
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const statusFilterRef = useRef<HTMLDivElement>(null);
  const suiteFilterRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError } = useQuery(testRunByIdQueryOptions(testRunId));

  // projectId 조회 (차트용)
  const { data: dashboardData } = useQuery({
    ...dashboardQueryOptions.stats(projectSlug),
    enabled: !!projectSlug,
  });
  const projectId = dashboardData?.success ? dashboardData.data.project.id : undefined;

  // 전체 테스트 실행 목록 (간트차트용)
  const { data: testRunsData } = useQuery({
    ...testRunsQueryOptions(projectId!),
    enabled: !!projectId,
  });
  const allTestRuns = testRunsData?.success ? testRunsData.data : [];

  // 마일스톤 데이터 (간트차트용 - 현재 실행 기준)
  const { data: milestonesData } = useQuery({
    ...dashboardQueryOptions.milestones(projectId!, testRunId),
    enabled: !!projectId,
  });
  const dashboardMilestones = milestonesData?.success ? milestonesData.data : [];

  // Close dropdowns on click outside
  useOutsideClick(statusDropdownRef, () => setShowStatusDropdown(false), showStatusDropdown);
  useOutsideClick(statusFilterRef, () => setShowStatusFilterDropdown(false), showStatusFilterDropdown);
  useOutsideClick(suiteFilterRef, () => setShowSuiteFilterDropdown(false), showSuiteFilterDropdown);
  useOutsideClick(sourceDropdownRef, () => setShowSourceDropdown(false), showSourceDropdown);

  const updateMutation = useMutation({
    mutationFn: updateTestCaseRunStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testRun', testRunId] });
    },
  });

  const removeSuiteMutation = useMutation({
    mutationFn: ({ suiteId }: { suiteId: string }) =>
      removeSuiteFromRun({ testRunId, suiteId }),
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
      setIsEditingTitle(false);
    },
    onError: () => {
      toast.error('제목 변경 중 오류가 발생했습니다.');
      setIsEditingTitle(false);
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: bulkUpdateTestCaseRunStatus,
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`${result.data.updatedCount}개 케이스 상태가 변경되었습니다.`);
        queryClient.invalidateQueries({ queryKey: ['testRun', testRunId] });
        if (projectId) queryClient.invalidateQueries({ queryKey: ['testRuns', projectId] });
        setSelectedCaseIds(new Set());
      } else {
        toast.error(Object.values(result.errors).flat().join(', '));
      }
    },
    onError: () => {
      toast.error('일괄 상태 변경 중 오류가 발생했습니다.');
    },
  });

  const testRun = data?.success ? data.data : null;

  // 차트 데이터
  const testStatusData: TestStatusData = useMemo(() => {
    if (!testRun) return { pass: 0, fail: 0, blocked: 0, untested: 0 };
    return {
      pass: testRun.stats.pass,
      fail: testRun.stats.fail,
      blocked: testRun.stats.blocked,
      untested: testRun.stats.untested,
    };
  }, [testRun]);
  // 테스트 실행 상세 View 이벤트
  useEffect(() => {
    if (testRun) {
      track(TESTRUN_EVENTS.DETAIL_VIEW, { run_id: testRunId, project_slug: projectSlug });
    }
  }, [testRun, testRunId, projectSlug]);

  // Extract unique suites from test case runs
  const availableSuites = useMemo(() => {
    if (!testRun?.testCaseRuns) return [];
    const suiteMap = new Map<string, string>();
    for (const tc of testRun.testCaseRuns) {
      if (tc.testSuiteId && tc.testSuiteName) {
        suiteMap.set(tc.testSuiteId, tc.testSuiteName);
      }
    }
    return Array.from(suiteMap.entries()).map(([id, name]) => ({ id, name }));
  }, [testRun]);

  // Filter and search test cases
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

  // Group test cases by test suite
  const groupedCases = useMemo((): GroupedCases[] => {
    if (!testRun) return [];

    const groups = new Map<string, GroupedCases>();

    for (const tc of filteredCases) {
      const key = tc.testSuiteId || '__unclassified__';
      const suiteName = tc.testSuiteName || '미분류';

      if (!groups.has(key)) {
        groups.set(key, {
          groupKey: key,
          suiteId: tc.testSuiteId,
          suiteName,
          cases: [],
        });
      }
      groups.get(key)!.cases.push(tc);
    }

    // Sort groups: named suites first (alphabetical), then unclassified last
    const sorted = Array.from(groups.values()).sort((a, b) => {
      if (!a.suiteId && b.suiteId) return 1;
      if (a.suiteId && !b.suiteId) return -1;
      return a.suiteName.localeCompare(b.suiteName);
    });

    return sorted;
  }, [testRun, filteredCases]);

  // Bulk selection handlers
  const handleToggleSelect = useCallback((id: string) => {
    setSelectedCaseIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggleGroupSelect = useCallback((caseIds: string[]) => {
    setSelectedCaseIds(prev => {
      const next = new Set(prev);
      const allSelected = caseIds.every(id => next.has(id));
      if (allSelected) {
        caseIds.forEach(id => next.delete(id));
      } else {
        caseIds.forEach(id => next.add(id));
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedCaseIds(new Set(filteredCases.map(c => c.id)));
  }, [filteredCases]);

  const handleDeselectAll = useCallback(() => {
    setSelectedCaseIds(new Set());
  }, []);

  const handleBulkStatusChange = useCallback((status: TestCaseRunStatus) => {
    if (selectedCaseIds.size === 0) return;
    bulkUpdateMutation.mutate({
      testCaseRunIds: Array.from(selectedCaseIds),
      status,
    });
  }, [selectedCaseIds, bulkUpdateMutation]);

  // Get selected case
  const selectedCase = useMemo(() => {
    if (!selectedCaseId || !testRun) return null;
    return testRun.testCaseRuns.find((tc) => tc.id === selectedCaseId) || null;
  }, [selectedCaseId, testRun]);

  // Auto-select first case if none selected
  useEffect(() => {
    if (!selectedCaseId && filteredCases.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- legitimate initial sync
      setSelectedCaseId(filteredCases[0].id);
    }
  }, [filteredCases, selectedCaseId]);

  // Update comment when selected case changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing editable state from selected case
    setComment(selectedCase?.comment || '');
  }, [selectedCase]);

  // Handle status change
  const handleStatusChange = useCallback(async (status: TestCaseRunStatus) => {
    if (!selectedCase) return;

    track(TESTRUN_EVENTS.RESULT_UPDATE, { status, case_id: selectedCase.id });

    await updateMutation.mutateAsync({
      testCaseRunId: selectedCase.id,
      status,
      comment: comment || null,
    });

    // Move to next untested case
    const currentIndex = filteredCases.findIndex((tc) => tc.id === selectedCase.id);
    const nextUntested = filteredCases.find((tc, i) => i > currentIndex && tc.status === 'untested');
    if (nextUntested) {
      setSelectedCaseId(nextUntested.id);
    } else {
      // If no more untested, move to next case
      const nextCase = filteredCases[currentIndex + 1];
      if (nextCase) {
        setSelectedCaseId(nextCase.id);
      }
    }
  }, [selectedCase, comment, filteredCases, updateMutation]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'p':
          handleStatusChange('pass');
          break;
        case 'f':
          handleStatusChange('fail');
          break;
        case 'b':
          handleStatusChange('blocked');
          break;
        case 'u':
          handleStatusChange('untested');
          break;
        case 'arrowdown':
        case 'j':
          e.preventDefault();
          const currentIdx = filteredCases.findIndex((tc) => tc.id === selectedCaseId);
          if (currentIdx < filteredCases.length - 1) {
            setSelectedCaseId(filteredCases[currentIdx + 1].id);
          }
          break;
        case 'arrowup':
        case 'k':
          e.preventDefault();
          const currIdx = filteredCases.findIndex((tc) => tc.id === selectedCaseId);
          if (currIdx > 0) {
            setSelectedCaseId(filteredCases[currIdx - 1].id);
          }
          break;
        case '?':
          setShowShortcuts((prev) => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCaseId, filteredCases, handleStatusChange]);

  // 로딩 상태 — 스켈레톤 UI
  if (isLoading) {
    return <RunDetailSkeleton />;
  }

  if (isError || !testRun) {
    return (
      <MainContainer className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <XCircle className="h-12 w-12 text-red-400" />
          <p className="text-text-1 font-semibold">테스트 실행을 불러올 수 없습니다.</p>
          <Link href={`/projects/${projectSlug}/runs`} className="text-primary hover:underline">
            목록으로 돌아가기
          </Link>
        </div>
      </MainContainer>
    );
  }

  const statusInfo = RUN_STATUS_CONFIG[testRun.status] || RUN_STATUS_CONFIG.NOT_STARTED;
  const sourceInfo = SOURCE_TYPE_CONFIG[testRun.sourceType] || SOURCE_TYPE_CONFIG.ADHOC;

  return (
    <MainContainer className="flex flex-1 flex-col min-h-screen">
        {/* Header */}
        <header className="border-line-2 flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/projects/${projectSlug}/runs`}
              className="text-text-3 hover:text-text-1 flex items-center gap-1 transition-colors"
              aria-label="테스트 실행 목록으로 돌아가기"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                {isEditingTitle ? (
                  <form
                    className="flex items-center gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (editTitle.trim() && editTitle.trim() !== testRun.name) {
                        renameMutation.mutate({ name: editTitle });
                      } else {
                        setIsEditingTitle(false);
                      }
                    }}
                  >
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="text-lg font-semibold bg-bg-2 border border-line-2 rounded-2 px-2 py-0.5 text-text-1 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setIsEditingTitle(false);
                      }}
                      disabled={renameMutation.isPending}
                    />
                    <button
                      type="submit"
                      className="text-primary hover:text-primary/80 transition-colors"
                      disabled={renameMutation.isPending}
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingTitle(false)}
                      className="text-text-3 hover:text-text-1 transition-colors"
                      disabled={renameMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </form>
                ) : (
                  <button
                    className="group/title flex items-center gap-2 text-lg font-semibold hover:text-primary transition-colors"
                    onClick={() => {
                      setEditTitle(testRun.name);
                      setIsEditingTitle(true);
                    }}
                  >
                    {testRun.name}
                    <Pencil className="h-3.5 w-3.5 text-text-4 opacity-0 group-hover/title:opacity-100 transition-opacity" />
                  </button>
                )}
                <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', statusInfo.style)}>
                  {statusInfo.label}
                </span>
              </div>
              <div className="text-text-3 flex items-center gap-2 text-sm" ref={sourceDropdownRef}>
                {sourceInfo.icon}
                {(() => {
                  const suites = testRun.sources.filter(s => s.type === 'suite');
                  const milestoneSource = testRun.sources.find(s => s.type === 'milestone');
                  const MAX_VISIBLE = 2;

                  if (suites.length === 0) {
                    return <span>{testRun.sourceName}</span>;
                  }

                  const visible = suites.slice(0, MAX_VISIBLE);
                  const hiddenCount = suites.length - MAX_VISIBLE;

                  return (
                    <span className="relative flex items-center gap-1">
                      <span>{visible.map(s => s.name).join(', ')}</span>
                      {hiddenCount > 0 && (
                        <>
                          <button
                            onClick={() => setShowSourceDropdown(!showSourceDropdown)}
                            className="inline-flex items-center rounded-1 bg-bg-4 px-1 py-0.5 text-[10px] font-medium text-text-2 hover:bg-bg-3 hover:text-text-1 transition-colors cursor-pointer"
                          >
                            +{hiddenCount}
                            <ChevronDown className={`ml-0.5 h-3 w-3 transition-transform ${showSourceDropdown ? 'rotate-180' : ''}`} />
                          </button>
                          {showSourceDropdown && (
                            <span className="absolute top-full left-0 z-20 mt-1 w-max max-w-xs rounded-2 border border-line-2 bg-bg-1 px-3 py-2 text-xs text-text-2 shadow-2">
                              {suites.map((s, i) => (
                                <span key={i} className="block py-0.5">{s.name}</span>
                              ))}
                            </span>
                          )}
                        </>
                      )}
                      {milestoneSource && <span className="ml-1">| 마일스톤: {milestoneSource.name}</span>}
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Progress Stats */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              {(['pass', 'fail', 'blocked', 'untested'] as const).map((status) => (
                <div key={status} className={cn('flex items-center gap-1.5', STATUS_CONFIG[status].style)}>
                  {STATUS_CONFIG[status].icon}
                  <span className="text-sm font-medium">{testRun.stats[status]}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-bg-3 h-2 w-32 overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-300"
                  style={{ width: `${testRun.stats.progressPercent}%` }}
                />
              </div>
              <span className="text-text-2 text-sm font-medium">{testRun.stats.progressPercent}%</span>
            </div>
            <ShareButton
              testRunId={testRunId}
              shareToken={testRun.shareToken}
              shareExpiresAt={testRun.shareExpiresAt}
            />
            <button
              onClick={() => setShowShortcuts(true)}
              className="text-text-3 hover:text-text-1 flex items-center gap-1 text-sm transition-colors"
              aria-label="키보드 단축키 보기"
            >
              <Keyboard className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* Test Status Charts */}
        <div className="border-line-2 flex flex-col gap-4 border-b px-6 py-4">
          <TestStatusChart data={testStatusData} />
          <MilestoneGanttChart
            milestones={dashboardMilestones}
            testRuns={allTestRuns}
            selectedRunId={testRunId}
            onRunChangeAction={() => {}}
            hideRunSelector
          />
        </div>

        {/* Main Content - sticky panels */}
        <div className="sticky top-0 flex h-screen overflow-hidden">
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
            selectedCaseIds={selectedCaseIds}
            onToggleSelect={handleToggleSelect}
            onToggleGroupSelect={handleToggleGroupSelect}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            onBulkStatusChange={handleBulkStatusChange}
            isBulkUpdating={bulkUpdateMutation.isPending}
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
            showStatusDropdown={showStatusDropdown}
            setShowStatusDropdown={setShowStatusDropdown}
            statusDropdownRef={statusDropdownRef}
          />
        </div>

      <KeyboardShortcutsModal
        open={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      {removeSuiteTarget && (
        <Dialog.Root defaultOpen onOpenChange={(open) => { if (!open) setRemoveSuiteTarget(null); }}>
          <Dialog.Portal>
            <Dialog.Overlay />
            <Dialog.Content className="bg-bg-1 rounded-8 w-full max-w-md p-6 shadow-xl">
              <Dialog.Title className="text-lg font-semibold text-text-1">
                스위트를 제거하시겠습니까?
              </Dialog.Title>
              <Dialog.Description className="text-text-3 mt-3 text-sm">
                <strong className="text-text-1">&quot;{removeSuiteTarget.name}&quot;</strong> 스위트와 해당 스위트에서 추가된 모든 테스트 케이스 실행 결과가 이 테스트 실행에서 제거됩니다.
              </Dialog.Description>
              <div className="mt-6 flex justify-end gap-3">
                <DSButton variant="ghost" onClick={() => setRemoveSuiteTarget(null)} disabled={removeSuiteMutation.isPending}>
                  취소
                </DSButton>
                <DSButton
                  variant="solid"
                  className="bg-system-red hover:bg-system-red/90"
                  onClick={() => removeSuiteMutation.mutate({ suiteId: removeSuiteTarget.id })}
                  disabled={removeSuiteMutation.isPending}
                >
                  {removeSuiteMutation.isPending ? '제거 중...' : '제거'}
                </DSButton>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}

    </MainContainer>
  );
};
