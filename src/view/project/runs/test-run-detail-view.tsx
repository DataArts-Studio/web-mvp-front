'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Container, DSButton, MainContainer, cn, LoadingSpinner } from '@/shared';
import { useOutsideClick, useToggleSet } from '@/shared/hooks';
import { Aside } from '@/widgets';
import { testRunByIdQueryOptions, updateTestCaseRunStatus, TestCaseRunDetail } from '@/features/runs';
import { track, TESTRUN_EVENTS } from '@/shared/lib/analytics';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Circle,
  Search,
  ChevronRight,
  ChevronDown,
  MessageSquare,
  Clock,
  ListTodo,
  PlayCircle,
  FolderOpen,
  Filter,
  Keyboard,
  Loader2,
} from 'lucide-react';

type StatusFilter = 'all' | 'untested' | 'pass' | 'fail' | 'blocked';
type TestCaseRunStatus = 'untested' | 'pass' | 'fail' | 'blocked';

interface GroupedCases {
  groupKey: string;
  suiteId: string | null;
  suiteName: string;
  cases: TestCaseRunDetail[];
}

const STATUS_CONFIG: Record<TestCaseRunStatus, {
  label: string;
  style: string;
  bgStyle: string;
  icon: React.ReactNode;
  shortcut: string;
}> = {
  untested: {
    label: 'Untested',
    style: 'text-slate-400',
    bgStyle: 'bg-slate-500/10 hover:bg-slate-500/20 border-slate-500/30',
    icon: <Circle className="h-4 w-4" />,
    shortcut: 'U',
  },
  pass: {
    label: 'Pass',
    style: 'text-green-400',
    bgStyle: 'bg-green-500/10 hover:bg-green-500/20 border-green-500/30',
    icon: <CheckCircle2 className="h-4 w-4" />,
    shortcut: 'P',
  },
  fail: {
    label: 'Fail',
    style: 'text-red-400',
    bgStyle: 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30',
    icon: <XCircle className="h-4 w-4" />,
    shortcut: 'F',
  },
  blocked: {
    label: 'Blocked',
    style: 'text-amber-400',
    bgStyle: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30',
    icon: <AlertTriangle className="h-4 w-4" />,
    shortcut: 'B',
  },
};

const RUN_STATUS_CONFIG: Record<string, { label: string; style: string }> = {
  NOT_STARTED: { label: 'Not Started', style: 'bg-slate-500/20 text-slate-300' },
  IN_PROGRESS: { label: 'In Progress', style: 'bg-blue-500/20 text-blue-300' },
  COMPLETED: { label: 'Completed', style: 'bg-green-500/20 text-green-300' },
};

const SOURCE_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  SUITE: { label: '스위트', icon: <ListTodo className="h-4 w-4" /> },
  MILESTONE: { label: '마일스톤', icon: <Clock className="h-4 w-4" /> },
  ADHOC: { label: '직접 선택', icon: <PlayCircle className="h-4 w-4" /> },
};

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
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showStatusFilterDropdown, setShowStatusFilterDropdown] = useState(false);
  const [showSuiteFilterDropdown, setShowSuiteFilterDropdown] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const statusFilterRef = useRef<HTMLDivElement>(null);
  const suiteFilterRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError } = useQuery(testRunByIdQueryOptions(testRunId));

  // Close dropdowns on click outside
  useOutsideClick(statusDropdownRef, () => setShowStatusDropdown(false), showStatusDropdown);
  useOutsideClick(statusFilterRef, () => setShowStatusFilterDropdown(false), showStatusFilterDropdown);
  useOutsideClick(suiteFilterRef, () => setShowSuiteFilterDropdown(false), showSuiteFilterDropdown);

  const updateMutation = useMutation({
    mutationFn: updateTestCaseRunStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testRun', testRunId] });
    },
  });

  const testRun = data?.success ? data.data : null;

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

  // Get selected case
  const selectedCase = useMemo(() => {
    if (!selectedCaseId || !testRun) return null;
    return testRun.testCaseRuns.find((tc) => tc.id === selectedCaseId) || null;
  }, [selectedCaseId, testRun]);

  // Auto-select first case if none selected
  useEffect(() => {
    if (!selectedCaseId && filteredCases.length > 0) {
      setSelectedCaseId(filteredCases[0].id);
    }
  }, [filteredCases, selectedCaseId]);

  // Update comment when selected case changes
  useEffect(() => {
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

  if (isLoading) {
    return (
      <Container className="bg-bg-1 text-text-1 flex min-h-screen font-sans">
        <Aside />
        <MainContainer className="flex flex-1 items-center justify-center">
          <LoadingSpinner size="lg" />
        </MainContainer>
      </Container>
    );
  }

  if (isError || !testRun) {
    return (
      <Container className="bg-bg-1 text-text-1 flex min-h-screen font-sans">
        <Aside />
        <MainContainer className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <XCircle className="h-12 w-12 text-red-400" />
            <p className="text-text-1 font-semibold">테스트 실행을 불러올 수 없습니다.</p>
            <Link href={`/projects/${projectSlug}/runs`} className="text-primary hover:underline">
              목록으로 돌아가기
            </Link>
          </div>
        </MainContainer>
      </Container>
    );
  }

  const statusInfo = RUN_STATUS_CONFIG[testRun.status] || RUN_STATUS_CONFIG.NOT_STARTED;
  const sourceInfo = SOURCE_TYPE_CONFIG[testRun.sourceType] || SOURCE_TYPE_CONFIG.ADHOC;

  return (
    <Container className="bg-bg-1 text-text-1 flex min-h-screen font-sans">
      <Aside />

      <div className="flex flex-1 flex-col">
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
                <h1 className="text-lg font-semibold">{testRun.name}</h1>
                <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', statusInfo.style)}>
                  {statusInfo.label}
                </span>
              </div>
              <div className="text-text-3 flex items-center gap-2 text-sm">
                {sourceInfo.icon}
                <span>{testRun.sourceName}</span>
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
            <button
              onClick={() => setShowShortcuts(true)}
              className="text-text-3 hover:text-text-1 flex items-center gap-1 text-sm transition-colors"
              aria-label="키보드 단축키 보기"
            >
              <Keyboard className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Test Case List */}
          <div className="border-line-2 flex w-[60%] flex-col border-r">
            {/* Search & Filter */}
            <div className="border-line-2 flex flex-col gap-3 border-b p-4">
              <div className="relative">
                <Search className="text-text-3 pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="케이스 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-bg-2 border-line-2 text-text-1 placeholder:text-text-4 focus:border-primary w-full rounded-lg border py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Filter Dropdowns */}
              <div className="flex gap-2">
                {/* Status Filter Dropdown */}
                <div className="relative flex-1" ref={statusFilterRef}>
                  <button
                    onClick={() => {
                      setShowStatusFilterDropdown(!showStatusFilterDropdown);
                      setShowSuiteFilterDropdown(false);
                    }}
                    className="bg-bg-2 border-line-2 hover:border-line-1 flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {statusFilter === 'all' ? (
                        <>
                          <Filter className="text-text-3 h-4 w-4" />
                          <span className="text-text-1">전체 상태</span>
                        </>
                      ) : (
                        <>
                          <span className={STATUS_CONFIG[statusFilter].style}>
                            {STATUS_CONFIG[statusFilter].icon}
                          </span>
                          <span className="text-text-1">{STATUS_CONFIG[statusFilter].label}</span>
                          <span className="text-text-3 text-xs">({testRun.stats[statusFilter]})</span>
                        </>
                      )}
                    </div>
                    <ChevronDown className={cn('text-text-3 h-4 w-4 transition-transform', showStatusFilterDropdown && 'rotate-180')} />
                  </button>

                  {showStatusFilterDropdown && (
                    <div className="bg-bg-2 border-line-2 absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-lg border shadow-xl">
                      <button
                        onClick={() => {
                          setStatusFilter('all');
                          setShowStatusFilterDropdown(false);
                        }}
                        className={cn(
                          'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors',
                          statusFilter === 'all' ? 'bg-primary/10 text-primary' : 'hover:bg-bg-3'
                        )}
                      >
                        <Filter className="h-4 w-4" />
                        <span>전체 상태</span>
                        <span className="text-text-3 ml-auto text-xs">({testRun.stats.total})</span>
                      </button>
                      {(['untested', 'pass', 'fail', 'blocked'] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => {
                            setStatusFilter(status);
                            setShowStatusFilterDropdown(false);
                          }}
                          className={cn(
                            'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors',
                            statusFilter === status ? 'bg-primary/10 text-primary' : 'hover:bg-bg-3'
                          )}
                        >
                          <span className={STATUS_CONFIG[status].style}>{STATUS_CONFIG[status].icon}</span>
                          <span>{STATUS_CONFIG[status].label}</span>
                          <span className="text-text-3 ml-auto text-xs">({testRun.stats[status]})</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Suite Filter Dropdown */}
                <div className="relative flex-1" ref={suiteFilterRef}>
                  <button
                    onClick={() => {
                      setShowSuiteFilterDropdown(!showSuiteFilterDropdown);
                      setShowStatusFilterDropdown(false);
                    }}
                    className="bg-bg-2 border-line-2 hover:border-line-1 flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FolderOpen className={cn('h-4 w-4', suiteFilter !== 'all' ? 'text-primary' : 'text-text-3')} />
                      <span className="text-text-1 truncate">
                        {suiteFilter === 'all'
                          ? '스위트'
                          : availableSuites.find(s => s.id === suiteFilter)?.name || '스위트'}
                      </span>
                    </div>
                    <ChevronDown className={cn('text-text-3 h-4 w-4 flex-shrink-0 transition-transform', showSuiteFilterDropdown && 'rotate-180')} />
                  </button>

                  {showSuiteFilterDropdown && (
                    <div className="bg-bg-2 border-line-2 absolute left-0 right-0 top-full z-30 mt-1 max-h-60 overflow-y-auto rounded-lg border shadow-xl">
                      <button
                        onClick={() => {
                          setSuiteFilter('all');
                          setShowSuiteFilterDropdown(false);
                        }}
                        className={cn(
                          'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors',
                          suiteFilter === 'all' ? 'bg-primary/10 text-primary' : 'hover:bg-bg-3'
                        )}
                      >
                        <FolderOpen className="h-4 w-4" />
                        <span>전체 스위트</span>
                      </button>
                      {availableSuites.length === 0 ? (
                        <div className="text-text-3 px-3 py-2 text-sm">스위트 없음</div>
                      ) : (
                        availableSuites.map((suite) => (
                          <button
                            key={suite.id}
                            onClick={() => {
                              setSuiteFilter(suite.id);
                              setShowSuiteFilterDropdown(false);
                            }}
                            className={cn(
                              'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors',
                              suiteFilter === suite.id ? 'bg-primary/10 text-primary' : 'hover:bg-bg-3'
                            )}
                          >
                            <FolderOpen className="h-4 w-4" />
                            <span className="truncate">{suite.name}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Case List - Grouped by Source */}
            <div className="flex-1 overflow-y-auto">
              {filteredCases.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Filter className="text-text-3 mb-2 h-8 w-8" />
                  <p className="text-text-2">검색 결과가 없습니다.</p>
                </div>
              ) : (
                groupedCases.map((group) => {
                  const isCollapsed = collapsedGroups.has(group.groupKey);
                  const groupPass = group.cases.filter(c => c.status === 'pass').length;
                  const groupFail = group.cases.filter(c => c.status === 'fail').length;
                  const groupBlocked = group.cases.filter(c => c.status === 'blocked').length;

                  return (
                    <div key={group.groupKey}>
                      {/* Suite Group Header - non-interactive section divider */}
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => collapsedGroups.toggle(group.groupKey)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); collapsedGroups.toggle(group.groupKey); } }}
                        className="bg-bg-3/50 border-line-2 sticky top-0 z-10 flex cursor-pointer select-none items-center gap-2 border-b px-3 py-1.5"
                      >
                        <ChevronDown
                          className={cn(
                            'text-text-4 h-3.5 w-3.5 transition-transform',
                            isCollapsed && '-rotate-90'
                          )}
                        />
                        <FolderOpen className="text-text-3 h-3.5 w-3.5" />
                        <span className="text-text-2 flex-1 text-xs font-semibold uppercase tracking-wide">
                          {group.suiteName}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px]">
                          {groupPass > 0 && (
                            <span className="text-green-400/70">{groupPass}P</span>
                          )}
                          {groupFail > 0 && (
                            <span className="text-red-400/70">{groupFail}F</span>
                          )}
                          {groupBlocked > 0 && (
                            <span className="text-amber-400/70">{groupBlocked}B</span>
                          )}
                          <span className="text-text-4">
                            {group.cases.length}
                          </span>
                        </div>
                      </div>

                      {/* Test Case Items */}
                      {!isCollapsed && group.cases.map((tc, index) => {
                        const config = STATUS_CONFIG[tc.status];
                        const isSelected = tc.id === selectedCaseId;

                        return (
                          <button
                            key={tc.id}
                            onClick={() => setSelectedCaseId(tc.id)}
                            className={cn(
                              'border-line-2 flex w-full items-center gap-3 border-b py-3 pl-8 pr-4 text-left transition-colors',
                              isSelected ? 'bg-primary/10' : 'hover:bg-bg-2'
                            )}
                          >
                            <span className={cn('flex-shrink-0', config.style)}>{config.icon}</span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-primary font-mono text-xs">{tc.code || `#${index + 1}`}</span>
                                {tc.comment && <MessageSquare className="text-text-3 h-3 w-3" />}
                              </div>
                              <p className="text-text-1 truncate text-sm">{tc.title || '제목 없음'}</p>
                            </div>
                            {isSelected && <ChevronRight className="text-text-3 h-4 w-4 flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel - Test Case Detail */}
          <div className="flex w-[40%] flex-col overflow-hidden">
            {selectedCase ? (
              <>
                {/* Case Header */}
                <div className="border-line-2 border-b p-6">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-primary font-mono text-sm">{selectedCase.code}</span>
                    <span className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                      STATUS_CONFIG[selectedCase.status].style,
                      STATUS_CONFIG[selectedCase.status].bgStyle.split(' ')[0]
                    )}>
                      {STATUS_CONFIG[selectedCase.status].icon}
                      {STATUS_CONFIG[selectedCase.status].label}
                    </span>
                  </div>
                  <h2 className="text-text-1 text-xl font-semibold">{selectedCase.title || '제목 없음'}</h2>
                </div>

                {/* Status Dropdown */}
                <div className="border-line-2 relative border-b p-6">
                  {updateMutation.isPending && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-bg-1/70 backdrop-blur-sm">
                      <div className="flex items-center gap-2 text-primary">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="text-sm font-medium">저장 중...</span>
                      </div>
                    </div>
                  )}
                  <h3 className="text-text-2 mb-3 text-sm font-medium">결과 기록</h3>
                  <div className="relative" ref={statusDropdownRef}>
                    <button
                      onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                      disabled={updateMutation.isPending}
                      className={cn(
                        'flex w-full items-center justify-between rounded-lg border-2 px-4 py-3 transition-all',
                        STATUS_CONFIG[selectedCase.status].bgStyle,
                        STATUS_CONFIG[selectedCase.status].style
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{STATUS_CONFIG[selectedCase.status].icon}</span>
                        <span className="font-medium">{STATUS_CONFIG[selectedCase.status].label}</span>
                      </div>
                      <ChevronDown className={cn('h-5 w-5 transition-transform', showStatusDropdown && 'rotate-180')} />
                    </button>

                    {showStatusDropdown && (
                      <div className="bg-bg-2 border-line-2 absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border shadow-xl">
                        {(['pass', 'fail', 'blocked', 'untested'] as const).map((status) => {
                          const config = STATUS_CONFIG[status];
                          const isActive = selectedCase.status === status;

                          return (
                            <button
                              key={status}
                              onClick={() => {
                                handleStatusChange(status);
                                setShowStatusDropdown(false);
                              }}
                              className={cn(
                                'flex w-full items-center gap-3 px-4 py-3 transition-colors',
                                isActive ? cn(config.bgStyle, config.style) : 'hover:bg-bg-3'
                              )}
                            >
                              <span className={cn('text-lg', isActive ? config.style : 'text-text-3')}>
                                {config.icon}
                              </span>
                              <span className={cn('flex-1 text-left font-medium', isActive ? config.style : 'text-text-1')}>
                                {config.label}
                              </span>
                              <kbd className="bg-bg-3 text-text-4 rounded px-1.5 py-0.5 text-xs">
                                {config.shortcut}
                              </kbd>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Comment Section */}
                <div className="flex-1 overflow-y-auto p-6">
                  <h3 className="text-text-2 mb-3 text-sm font-medium">코멘트</h3>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="테스트 결과에 대한 코멘트를 입력하세요..."
                    className="bg-bg-2 border-line-2 text-text-1 placeholder:text-text-4 focus:border-primary h-32 w-full resize-none rounded-lg border p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <div className="mt-3 flex justify-end">
                    <DSButton
                      size="small"
                      variant="ghost"
                      onClick={() => {
                        if (selectedCase) {
                          updateMutation.mutate({
                            testCaseRunId: selectedCase.id,
                            status: selectedCase.status,
                            comment: comment || null,
                          });
                        }
                      }}
                      disabled={updateMutation.isPending || comment === (selectedCase?.comment || '')}
                      className="flex items-center gap-2"
                    >
                      {updateMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                      코멘트 저장
                    </DSButton>
                  </div>
                </div>

                {/* Navigation Footer */}
                <div className="border-line-2 flex items-center justify-between border-t p-4">
                  <div className="text-text-3 text-sm">
                    {filteredCases.findIndex((tc) => tc.id === selectedCaseId) + 1} / {filteredCases.length}
                  </div>
                  <div className="flex gap-2">
                    <DSButton
                      size="small"
                      variant="ghost"
                      onClick={() => {
                        const idx = filteredCases.findIndex((tc) => tc.id === selectedCaseId);
                        if (idx > 0) setSelectedCaseId(filteredCases[idx - 1].id);
                      }}
                      disabled={filteredCases.findIndex((tc) => tc.id === selectedCaseId) === 0}
                    >
                      이전
                    </DSButton>
                    <DSButton
                      size="small"
                      variant="ghost"
                      onClick={() => {
                        const idx = filteredCases.findIndex((tc) => tc.id === selectedCaseId);
                        if (idx < filteredCases.length - 1) setSelectedCaseId(filteredCases[idx + 1].id);
                      }}
                      disabled={filteredCases.findIndex((tc) => tc.id === selectedCaseId) === filteredCases.length - 1}
                    >
                      다음
                    </DSButton>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center">
                <ListTodo className="text-text-3 mb-4 h-12 w-12" />
                <p className="text-text-2 font-medium">테스트 케이스를 선택하세요</p>
                <p className="text-text-3 text-sm">왼쪽 목록에서 테스트할 케이스를 선택합니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowShortcuts(false)}>
          <div className="bg-bg-2 border-line-2 w-96 rounded-2xl border p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-text-1 mb-4 text-lg font-semibold">키보드 단축키</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-text-2">Pass로 기록</span>
                <kbd className="bg-bg-3 text-text-1 rounded px-2 py-1 text-sm">P</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-2">Fail로 기록</span>
                <kbd className="bg-bg-3 text-text-1 rounded px-2 py-1 text-sm">F</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-2">Blocked로 기록</span>
                <kbd className="bg-bg-3 text-text-1 rounded px-2 py-1 text-sm">B</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-2">Untested로 초기화</span>
                <kbd className="bg-bg-3 text-text-1 rounded px-2 py-1 text-sm">U</kbd>
              </div>
              <div className="border-line-2 my-3 border-t" />
              <div className="flex items-center justify-between">
                <span className="text-text-2">다음 케이스</span>
                <div className="flex gap-1">
                  <kbd className="bg-bg-3 text-text-1 rounded px-2 py-1 text-sm">↓</kbd>
                  <kbd className="bg-bg-3 text-text-1 rounded px-2 py-1 text-sm">J</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-2">이전 케이스</span>
                <div className="flex gap-1">
                  <kbd className="bg-bg-3 text-text-1 rounded px-2 py-1 text-sm">↑</kbd>
                  <kbd className="bg-bg-3 text-text-1 rounded px-2 py-1 text-sm">K</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-2">단축키 도움말</span>
                <kbd className="bg-bg-3 text-text-1 rounded px-2 py-1 text-sm">?</kbd>
              </div>
            </div>
            <button
              onClick={() => setShowShortcuts(false)}
              className="bg-primary mt-6 w-full rounded-lg py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              닫기
            </button>
          </div>
        </div>
      )}

    </Container>
  );
};
