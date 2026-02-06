'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Container, DSButton, MainContainer, cn, LoadingSpinner } from '@/shared';
import { Aside } from '@/widgets';
import { testRunByIdQueryOptions, updateTestCaseRunStatus, TestCaseRunDetail } from '@/features/runs';
import { AddToRunModal } from '@/features/runs-edit';
import { dashboardQueryOptions } from '@/features/dashboard';
import { testSuitesQueryOptions } from '@/entities/test-suite';
import { milestonesQueryOptions } from '@/entities/milestone';
import { getTestCases } from '@/entities/test-case/api';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Circle,
  Search,
  ChevronRight,
  MessageSquare,
  Clock,
  ListTodo,
  PlayCircle,
  Filter,
  Keyboard,
  Loader2,
  Plus,
  type LucideIcon,
} from 'lucide-react';

type StatusFilter = 'all' | 'untested' | 'pass' | 'fail' | 'blocked';
type TestCaseRunStatus = 'untested' | 'pass' | 'fail' | 'blocked';

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

type HeaderAction = {
  key: string;
  label: string;
  icon: LucideIcon;
};

const HEADER_ACTIONS: HeaderAction[] = [
  { key: 'addToRun', label: '테스트 추가하기', icon: Plus },
  // 새 메뉴를 여기에 추가하세요
  // { key: 'export', label: '결과 내보내기', icon: Download },
];

export const TestRunDetailView = () => {
  const params = useParams();
  const queryClient = useQueryClient();
  const testRunId = params.testRunId as string;
  const projectSlug = params.slug as string;

  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [comment, setComment] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError } = useQuery(testRunByIdQueryOptions(testRunId));

  // Fetch project ID via dashboard stats for loading suites/milestones/cases
  const { data: dashboardData } = useQuery(dashboardQueryOptions.stats(projectSlug));
  const projectId = dashboardData?.success ? dashboardData.data.project.id : undefined;

  const isAddToRunOpen = activeAction === 'addToRun';

  const { data: suitesData } = useQuery({
    ...testSuitesQueryOptions(projectId!),
    enabled: !!projectId && isAddToRunOpen,
  });

  const { data: milestonesData } = useQuery({
    ...milestonesQueryOptions(projectId!),
    enabled: !!projectId && isAddToRunOpen,
  });

  const { data: casesData } = useQuery({
    queryKey: ['testCases', projectId],
    queryFn: () => getTestCases({ project_id: projectId!, limits: { offset: 0, limit: 9999 } }),
    enabled: !!projectId && isAddToRunOpen,
  });

  // Close action menu on click outside
  useEffect(() => {
    if (!showActionMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        setShowActionMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showActionMenu]);

  const updateMutation = useMutation({
    mutationFn: updateTestCaseRunStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testRun', testRunId] });
    },
  });

  const testRun = data?.success ? data.data : null;

  // Compute available items for modals (exclude already-added)
  const existingCaseIds = useMemo(() => {
    if (!testRun) return new Set<string>();
    return new Set(testRun.testCaseRuns.map((tc) => tc.testCaseId));
  }, [testRun]);

  const availableSuites = useMemo(() => {
    if (!suitesData?.success) return [];
    return suitesData.data;
  }, [suitesData]);

  const availableMilestones = useMemo(() => {
    if (!milestonesData?.success) return [];
    return milestonesData.data;
  }, [milestonesData]);

  const availableCases = useMemo(() => {
    if (!casesData?.success) return [];
    return casesData.data.filter((tc) => !existingCaseIds.has(tc.id));
  }, [casesData, existingCaseIds]);

  // Filter and search test cases
  const filteredCases = useMemo(() => {
    if (!testRun) return [];

    return testRun.testCaseRuns.filter((tc) => {
      const matchesSearch =
        tc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tc.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = statusFilter === 'all' || tc.status === statusFilter;
      return matchesSearch && matchesFilter;
    });
  }, [testRun, searchQuery, statusFilter]);

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
            >
              <ArrowLeft className="h-4 w-4" />
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
            <div className="relative" ref={actionMenuRef}>
              <button
                onClick={() => setShowActionMenu((prev) => !prev)}
                className="text-text-3 hover:text-text-1 flex items-center gap-1 text-sm transition-colors"
                title="더보기"
              >
                <Plus className="h-4 w-4" />
              </button>
              {showActionMenu && (
                <div className="bg-bg-2 border-line-2 absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border py-1 shadow-xl">
                  {HEADER_ACTIONS.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.key}
                        onClick={() => {
                          setActiveAction(action.key);
                          setShowActionMenu(false);
                        }}
                        className="hover:bg-bg-3 text-text-1 flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors"
                      >
                        <Icon className="h-4 w-4 text-text-3" />
                        {action.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowShortcuts(true)}
              className="text-text-3 hover:text-text-1 flex items-center gap-1 text-sm transition-colors"
            >
              <Keyboard className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Test Case List */}
          <div className="border-line-2 flex w-[400px] flex-col border-r">
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
              <div className="flex gap-1">
                {(['all', 'untested', 'pass', 'fail', 'blocked'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={cn(
                      'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                      statusFilter === filter
                        ? 'bg-primary text-white'
                        : 'bg-bg-3 text-text-3 hover:bg-bg-4'
                    )}
                  >
                    {filter === 'all' ? '전체' : STATUS_CONFIG[filter].label}
                    {filter !== 'all' && (
                      <span className="ml-1 opacity-70">
                        ({testRun.stats[filter]})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Case List */}
            <div className="flex-1 overflow-y-auto">
              {filteredCases.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Filter className="text-text-3 mb-2 h-8 w-8" />
                  <p className="text-text-2">검색 결과가 없습니다.</p>
                </div>
              ) : (
                filteredCases.map((tc, index) => {
                  const config = STATUS_CONFIG[tc.status];
                  const isSelected = tc.id === selectedCaseId;

                  return (
                    <button
                      key={tc.id}
                      onClick={() => setSelectedCaseId(tc.id)}
                      className={cn(
                        'border-line-2 flex w-full items-center gap-3 border-b px-4 py-3 text-left transition-colors',
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
                })
              )}
            </div>
          </div>

          {/* Right Panel - Test Case Detail */}
          <div className="flex flex-1 flex-col overflow-hidden">
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

                {/* Status Buttons */}
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
                  <div className="grid grid-cols-4 gap-3">
                    {(['pass', 'fail', 'blocked', 'untested'] as const).map((status) => {
                      const config = STATUS_CONFIG[status];
                      const isActive = selectedCase.status === status;

                      return (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(status)}
                          disabled={updateMutation.isPending}
                          className={cn(
                            'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all',
                            isActive
                              ? cn(config.bgStyle, 'border-current', config.style)
                              : 'border-line-2 hover:border-line-1 bg-bg-2 hover:bg-bg-3'
                          )}
                        >
                          <span className={cn('text-2xl', isActive ? config.style : 'text-text-3')}>
                            {config.icon}
                          </span>
                          <span className={cn('text-sm font-medium', isActive ? config.style : 'text-text-2')}>
                            {config.label}
                          </span>
                          <kbd className="bg-bg-3 text-text-4 rounded px-1.5 py-0.5 text-xs">
                            {config.shortcut}
                          </kbd>
                        </button>
                      );
                    })}
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

      {/* Add to Run Modal */}
      {isAddToRunOpen && (
        <AddToRunModal
          runId={testRunId}
          availableCases={availableCases}
          availableSuites={availableSuites}
          availableMilestones={availableMilestones}
          onClose={() => setActiveAction(null)}
        />
      )}
    </Container>
  );
};
