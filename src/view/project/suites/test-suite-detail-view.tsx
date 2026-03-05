'use client';

import React, { useState, useRef } from 'react';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { testSuiteByIdQueryOptions } from '@/entities/test-suite/api/query';
import { getTestCases } from '@/entities/test-case/api/server-actions';
import { suiteSectionsQueryOptions, createSection, updateSection, deleteSection } from '@/entities/test-suite-section';
import type { TestSuiteSection } from '@/entities/test-suite-section';
import type { TestSuiteCard } from '@/entities/test-suite';
import type { TestCase, TestCaseCardType } from '@/entities/test-case';
import { SuiteEditForm, AddCasesToSuiteModal } from '@/features/suites-edit';
import { Container, MainContainer } from '@/shared/lib/primitives';
import { DSButton, EmptyState, LoadingSpinner } from '@/shared/ui';
import { cn } from '@/shared/utils';
import { Aside } from '@/widgets';
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  ChevronRight,
  Edit2,
  FolderTree,
  ListChecks,
  MoreHorizontal,
  PlayCircle,
  Plus,
  Tag,
  Trash2,
} from 'lucide-react';
import { ArchiveButton } from '@/features/archive/ui/archive-button';
import { track, TESTSUITE_EVENTS } from '@/shared/lib/analytics';
import { formatDate, formatDateTime } from '@/shared/utils/date-format';
import { toast } from 'sonner';

const AnimatePresence = dynamic(
  () => import('framer-motion').then((mod) => ({ default: mod.AnimatePresence })),
  { ssr: false }
);

const TestCaseSideView = dynamic(
  () => import('@/view/project/cases/test-case-side-view').then((mod) => ({ default: mod.TestCaseSideView })),
  { ssr: false }
);

const TAG_TONE_CONFIG: Record<string, { style: string }> = {
  neutral: { style: 'bg-slate-500/20 text-slate-300' },
  info: { style: 'bg-blue-500/20 text-blue-300' },
  success: { style: 'bg-green-500/20 text-green-300' },
  warning: { style: 'bg-amber-500/20 text-amber-300' },
  danger: { style: 'bg-red-500/20 text-red-300' },
};

const RUN_STATUS_CONFIG: Record<string, { label: string; style: string }> = {
  passed: { label: 'Passed', style: 'bg-green-500/20 text-green-300' },
  failed: { label: 'Failed', style: 'bg-red-500/20 text-red-300' },
  blocked: { label: 'Blocked', style: 'bg-amber-500/20 text-amber-300' },
  running: { label: 'Running', style: 'bg-blue-500/20 text-blue-300' },
  not_run: { label: 'Not Run', style: 'bg-slate-500/20 text-slate-300' },
};

const TEST_STATUS_CONFIG: Record<string, { label: string; style: string }> = {
  pass: { label: 'Passed', style: 'bg-green-500/20 text-green-300' },
  fail: { label: 'Failed', style: 'bg-red-500/20 text-red-300' },
  blocked: { label: 'Blocked', style: 'bg-amber-500/20 text-amber-300' },
  untested: { label: 'Untested', style: 'bg-slate-500/20 text-slate-300' },
};

const TestSuiteDetailView = () => {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const suiteId = params.suiteId as string;
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingCases, setIsAddingCases] = useState(false);
  const [selectedTestCaseId, setSelectedTestCaseId] = useState<string | null>(null);

  // 섹션 관련 상태
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [isCreatingSection, setIsCreatingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionName, setEditingSectionName] = useState('');
  const [menuOpenSectionId, setMenuOpenSectionId] = useState<string | null>(null);
  const newSectionInputRef = useRef<HTMLInputElement>(null);
  const editSectionInputRef = useRef<HTMLInputElement>(null);

  // 실제 API로 스위트 데이터 조회 (통계 포함)
  const { data: suiteResult, isLoading: isSuiteLoading } = useQuery(testSuiteByIdQueryOptions(suiteId));

  // 해당 프로젝트의 테스트 케이스 조회
  const projectId = suiteResult?.success ? suiteResult.data?.projectId ?? '' : '';
  const { data: casesResult } = useQuery({
    queryKey: ['testCases', 'bySuite', suiteId],
    queryFn: () => getTestCases({ project_id: projectId }),
    enabled: !!projectId,
  });

  // 섹션 조회
  const { data: sectionsResult } = useQuery({
    ...suiteSectionsQueryOptions(suiteId),
    enabled: !!suiteId,
  });
  const sections: TestSuiteSection[] = sectionsResult?.success ? sectionsResult.data : [];

  const suite: TestSuiteCard | undefined = suiteResult?.success ? suiteResult.data : undefined;

  // 섹션 CRUD mutations
  const invalidateSections = () => queryClient.invalidateQueries({ queryKey: ['suiteSections', suiteId] });

  const createSectionMutation = useMutation({
    mutationFn: (name: string) => createSection({ suiteId, name }),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('섹션이 생성되었습니다.');
        invalidateSections();
        setIsCreatingSection(false);
        setNewSectionName('');
      } else {
        const msg = Object.values(result.errors ?? {}).flat().join(', ');
        toast.error(msg || '섹션 생성에 실패했습니다.');
      }
    },
  });

  const updateSectionMutation = useMutation({
    mutationFn: (input: { id: string; name: string }) => updateSection(input),
    onSuccess: (result) => {
      if (result.success) {
        invalidateSections();
        setEditingSectionId(null);
      } else {
        const msg = Object.values(result.errors ?? {}).flat().join(', ');
        toast.error(msg || '섹션 수정에 실패했습니다.');
      }
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: (sectionId: string) => deleteSection(sectionId),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
        invalidateSections();
        queryClient.invalidateQueries({ queryKey: ['testCases'] });
      } else {
        toast.error('섹션 삭제에 실패했습니다.');
      }
    },
  });

  React.useEffect(() => {
    if (suite) {
      track(TESTSUITE_EVENTS.DETAIL_VIEW, { suite_id: suiteId });
    }
  }, [suite, suiteId]);

  // 로딩 중
  if (isSuiteLoading) {
    return (
      <Container className="bg-bg-1 text-text-1 flex min-h-screen font-sans">
        <Aside />
        <MainContainer className="flex flex-1 items-center justify-center">
          <LoadingSpinner size="lg" />
        </MainContainer>
      </Container>
    );
  }

  // 해당 스위트에 속한 테스트 케이스 필터링
  const allCases = casesResult?.success ? casesResult.data ?? [] : [];
  const testCases: TestCaseCardType[] = allCases
    .filter((tc: TestCase) => tc.testSuiteId === suite?.id)
    .map((tc: TestCase) => ({
      ...tc,
      suiteTitle: suite?.title ?? '',
      status: tc.resultStatus,
      lastExecutedAt: null,
    }));

  // 섹션별 케이스 그룹화
  const casesBySection = new Map<string | null, TestCaseCardType[]>();
  for (const tc of testCases) {
    const key = tc.sectionId ?? null;
    if (!casesBySection.has(key)) casesBySection.set(key, []);
    casesBySection.get(key)!.push(tc);
  }
  const uncategorizedCases = casesBySection.get(null) ?? [];

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const handleCreateSection = () => {
    const name = newSectionName.trim();
    if (!name) return;
    createSectionMutation.mutate(name);
  };

  const handleRenameSection = (sectionId: string) => {
    const name = editingSectionName.trim();
    if (!name) return;
    updateSectionMutation.mutate({ id: sectionId, name });
  };

  const handleDeleteSection = (sectionId: string, caseCount: number) => {
    if (!confirm(`섹션을 삭제하시겠습니까?\n섹션만 삭제되며, 포함된 테스트 케이스 ${caseCount}개는 미분류로 이동됩니다.`)) return;
    deleteSectionMutation.mutate(sectionId);
  };

  if (!suite) {
    return (
      <Container className="bg-bg-1 text-text-1 flex min-h-screen font-sans">
        <Aside />
        <MainContainer className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-text-1 font-semibold">테스트 스위트를 찾을 수 없습니다.</p>
            <Link
              href={`/projects/${params.slug}/suites`}
              className="text-primary mt-4 inline-block hover:underline"
            >
              스위트 목록으로 돌아가기
            </Link>
          </div>
        </MainContainer>
      </Container>
    );
  }

  const tagToneStyle = TAG_TONE_CONFIG[suite.tag?.tone ?? 'neutral']?.style ?? TAG_TONE_CONFIG.neutral.style;

  // 통계 계산
  const passedCount = suite.lastRun?.counts.passed ?? 0;
  const totalCount = suite.lastRun?.total ?? suite.caseCount;
  const passRate = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;

  return (
    <Container className="bg-bg-1 text-text-1 flex min-h-screen font-sans">
      <Aside />
      <MainContainer className="mx-auto grid min-h-screen w-full max-w-[1200px] flex-1 grid-cols-6 content-start gap-x-5 gap-y-6 px-10 py-8">
        {/* 뒤로가기 + 헤더 */}
        <header className="col-span-6 flex flex-col gap-4">
          <Link
            href={`/projects/${params.slug}/suites`}
            className="text-text-3 hover:text-text-1 flex w-fit items-center gap-1 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            스위트 목록으로
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <h1 className="typo-title-heading">{suite.title}</h1>
                {suite.tag && (
                  <span className={cn('rounded-full px-3 py-1 text-sm font-medium', tagToneStyle)}>
                    {suite.tag.label}
                  </span>
                )}
              </div>
              <div className="text-text-3 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" strokeWidth={1.5} />
                  <span>생성일: {formatDate(suite.createdAt)}</span>
                </div>
                {suite.linkedMilestone && (
                  <Link
                    href={`/projects/${params.slug}/milestones/${suite.linkedMilestone.id}`}
                    className="hover:text-text-1 flex items-center gap-1.5 transition-colors"
                  >
                    <Tag className="h-4 w-4" strokeWidth={1.5} />
                    <span className="hover:underline">
                      {suite.linkedMilestone.title} ({suite.linkedMilestone.versionLabel})
                    </span>
                  </Link>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <DSButton variant="ghost" className="flex items-center gap-2" onClick={() => setIsEditing(true)}>
                <Edit2 className="h-4 w-4" />
                수정
              </DSButton>
              <ArchiveButton targetType='suite' targetId={suite.id} onSuccess={() => router.push(`/projects/${params.slug}/suites`)}/>
            </div>
          </div>
        </header>

        {/* 설명 */}
        <section className="col-span-6">
          <div className="bg-bg-2 border-line-2 rounded-4 border p-4">
            <p className="text-text-2">{suite.description || '설명이 없습니다.'}</p>
          </div>
        </section>

        {/* 포함 경로 */}
        {suite.includedPaths && suite.includedPaths.length > 0 && (
          <section className="col-span-6">
            <div className="bg-bg-2 border-line-2 rounded-4 border p-4">
              <div className="mb-3 flex items-center gap-2">
                <FolderTree className="text-text-3 h-4 w-4" strokeWidth={1.5} />
                <h3 className="text-text-3 font-semibold">포함된 경로</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {suite.includedPaths.map((path, index) => (
                  <code
                    key={index}
                    className="bg-bg-3 text-primary rounded px-2 py-1 font-mono text-sm"
                  >
                    {path}
                  </code>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 통계 카드 */}
        <section className="col-span-6 grid grid-cols-4 gap-4">
          {/* 테스트 케이스 수 */}
          <div className="bg-bg-2 border-line-2 rounded-4 flex flex-col gap-1 border p-4">
            <div className="text-text-3 flex items-center gap-1.5 text-sm">
              <ListChecks className="h-4 w-4" strokeWidth={1.5} />
              <span>테스트 케이스</span>
            </div>
            <span className="text-text-1 text-2xl font-bold">{suite.caseCount}개</span>
          </div>

          {/* 테스트 실행 횟수 */}
          <div className="bg-bg-2 border-line-2 rounded-4 flex flex-col gap-1 border p-4">
            <div className="text-text-3 flex items-center gap-1.5 text-sm">
              <PlayCircle className="h-4 w-4" strokeWidth={1.5} />
              <span>실행 이력</span>
            </div>
            <span className="text-text-1 text-2xl font-bold">{suite.executionHistoryCount}회</span>
          </div>

          {/* 통과율 */}
          <div className="bg-bg-2 border-line-2 rounded-4 col-span-2 border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-text-3 font-semibold">마지막 실행 통과율</h3>
              <span className="text-primary text-2xl font-bold">{passRate}%</span>
            </div>
            <div className="bg-bg-3 h-3 w-full rounded-full">
              <div
                className="bg-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${passRate}%` }}
              />
            </div>
            <p className="text-text-3 mt-2 text-sm">
              {passedCount} / {totalCount} 케이스 통과
            </p>
          </div>
        </section>

        {/* 마지막 실행 요약 */}
        {suite.lastRun && (
          <section className="col-span-6">
            <div className="bg-bg-2 border-line-2 rounded-4 border p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-text-1 font-semibold">마지막 실행</h3>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-medium',
                    RUN_STATUS_CONFIG[suite.lastRun.status]?.style ?? RUN_STATUS_CONFIG.not_run.style
                  )}
                >
                  {RUN_STATUS_CONFIG[suite.lastRun.status]?.label ?? suite.lastRun.status}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-4 text-center">
                <div>
                  <p className="text-text-3 text-sm">실행 일시</p>
                  <p className="text-text-1 font-medium">{formatDateTime(suite.lastRun.runAt)}</p>
                </div>
                <div>
                  <p className="text-text-3 text-sm">Passed</p>
                  <p className="font-medium text-green-400">{suite.lastRun.counts.passed}</p>
                </div>
                <div>
                  <p className="text-text-3 text-sm">Failed</p>
                  <p className="font-medium text-red-400">{suite.lastRun.counts.failed}</p>
                </div>
                <div>
                  <p className="text-text-3 text-sm">Blocked</p>
                  <p className="font-medium text-amber-400">{suite.lastRun.counts.blocked}</p>
                </div>
                <div>
                  <p className="text-text-3 text-sm">Skipped</p>
                  <p className="text-text-2 font-medium">{suite.lastRun.counts.skipped}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 테스트 케이스 목록 (섹션별 그룹화) */}
        <section className="col-span-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="typo-h2-heading">포함된 테스트 케이스</h2>
            <div className="flex items-center gap-2">
              <DSButton
                variant="ghost"
                size="small"
                className="flex items-center gap-1"
                onClick={() => {
                  setIsCreatingSection(true);
                  setTimeout(() => newSectionInputRef.current?.focus(), 0);
                }}
              >
                <Plus className="h-4 w-4" />
                섹션 추가
              </DSButton>
              {testCases.length > 0 && (
                <DSButton variant="ghost" size="small" className="flex items-center gap-1" onClick={() => setIsAddingCases(true)}>
                  <Plus className="h-4 w-4" />
                  케이스 추가
                </DSButton>
              )}
            </div>
          </div>

          {testCases.length === 0 && sections.length === 0 ? (
            <div className="bg-bg-2 border-line-2 rounded-4 border-2 border-dashed">
              <EmptyState
                icon={<ListChecks className="h-8 w-8" />}
                title="포함된 테스트 케이스가 없습니다."
                description="테스트 케이스를 추가하여 스위트 범위를 정의하세요."
                action={
                  <DSButton variant="ghost" className="flex items-center gap-1" onClick={() => setIsAddingCases(true)}>
                    <Plus className="h-4 w-4" />
                    테스트 케이스 추가
                  </DSButton>
                }
              />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* 섹션별 그룹 */}
              {sections.map((section) => {
                const sectionCases = casesBySection.get(section.id) ?? [];
                const isCollapsed = collapsedSections.has(section.id);
                const isRenaming = editingSectionId === section.id;

                return (
                  <div key={section.id} className="bg-bg-2 border-line-2 rounded-4 overflow-hidden border">
                    {/* 섹션 헤더 */}
                    <div className="border-line-2 flex items-center justify-between border-b px-4 py-2.5">
                      <button
                        type="button"
                        className="flex flex-1 items-center gap-2 text-left"
                        onClick={() => toggleSection(section.id)}
                      >
                        {isCollapsed
                          ? <ChevronRight className="text-text-3 h-4 w-4 shrink-0" />
                          : <ChevronDown className="text-text-3 h-4 w-4 shrink-0" />
                        }
                        {isRenaming ? (
                          <input
                            ref={editSectionInputRef}
                            type="text"
                            value={editingSectionName}
                            onChange={(e) => setEditingSectionName(e.target.value)}
                            onKeyDown={(e) => {
                              e.stopPropagation();
                              if (e.key === 'Enter') handleRenameSection(section.id);
                              if (e.key === 'Escape') setEditingSectionId(null);
                            }}
                            onBlur={() => handleRenameSection(section.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="typo-body2-heading text-text-1 bg-transparent outline-none border-b border-primary"
                            autoFocus
                          />
                        ) : (
                          <span className="typo-body2-heading text-text-1">{section.name}</span>
                        )}
                        <span className="text-text-3 text-xs">{sectionCases.length}개</span>
                      </button>
                      <div className="relative">
                        <button
                          type="button"
                          className="text-text-3 hover:text-text-1 rounded p-1 transition-colors"
                          onClick={() => setMenuOpenSectionId(menuOpenSectionId === section.id ? null : section.id)}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {menuOpenSectionId === section.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setMenuOpenSectionId(null)} />
                            <div className="bg-bg-2 border-line-2 absolute right-0 top-full z-50 mt-1 rounded-2 border py-1 shadow-lg min-w-[120px]">
                              <button
                                type="button"
                                className="text-text-2 hover:bg-bg-3 flex w-full items-center gap-2 px-3 py-2 text-sm"
                                onClick={() => {
                                  setEditingSectionId(section.id);
                                  setEditingSectionName(section.name);
                                  setMenuOpenSectionId(null);
                                  setTimeout(() => editSectionInputRef.current?.focus(), 0);
                                }}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                                이름 수정
                              </button>
                              <button
                                type="button"
                                className="text-red-400 hover:bg-bg-3 flex w-full items-center gap-2 px-3 py-2 text-sm"
                                onClick={() => {
                                  setMenuOpenSectionId(null);
                                  handleDeleteSection(section.id, sectionCases.length);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                섹션 삭제
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* 섹션 케이스 목록 */}
                    {!isCollapsed && (
                      <div className="divide-line-2 divide-y">
                        {sectionCases.length === 0 ? (
                          <div className="text-text-3 px-4 py-6 text-center text-sm">
                            이 섹션에 배정된 케이스가 없습니다.
                          </div>
                        ) : (
                          sectionCases.map((testCase: TestCaseCardType) => {
                            const statusConfig = TEST_STATUS_CONFIG[testCase.resultStatus] ?? TEST_STATUS_CONFIG.untested;
                            return (
                              <button
                                key={testCase.id}
                                type="button"
                                className="hover:bg-bg-3 flex w-full items-center justify-between px-4 py-3 text-left transition-colors"
                                onClick={() => setSelectedTestCaseId(testCase.id)}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-primary font-mono text-sm">{testCase.caseKey}</span>
                                  <span className="text-text-1">{testCase.title}</span>
                                  <div className="flex gap-1">
                                    {testCase.tags.slice(0, 2).map((tag: string) => (
                                      <span key={tag} className="bg-bg-3 text-text-3 rounded px-1.5 py-0.5 text-xs">{tag}</span>
                                    ))}
                                  </div>
                                </div>
                                <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', statusConfig.style)}>
                                  {statusConfig.label}
                                </span>
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* 섹션 추가 인라인 입력 */}
              {isCreatingSection && (
                <div className="bg-bg-2 border-line-2 rounded-4 flex items-center gap-2 border px-4 py-3">
                  <Plus className="text-text-3 h-4 w-4 shrink-0" />
                  <input
                    ref={newSectionInputRef}
                    type="text"
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateSection();
                      if (e.key === 'Escape') { setIsCreatingSection(false); setNewSectionName(''); }
                    }}
                    placeholder="새 섹션 이름을 입력하세요"
                    className="typo-body2-normal text-text-1 placeholder:text-text-3 flex-1 bg-transparent outline-none"
                    disabled={createSectionMutation.isPending}
                  />
                  <DSButton
                    size="small"
                    variant="solid"
                    onClick={handleCreateSection}
                    disabled={createSectionMutation.isPending || !newSectionName.trim()}
                  >
                    {createSectionMutation.isPending ? '생성 중...' : '추가'}
                  </DSButton>
                  <DSButton
                    size="small"
                    variant="ghost"
                    onClick={() => { setIsCreatingSection(false); setNewSectionName(''); }}
                  >
                    취소
                  </DSButton>
                </div>
              )}

              {/* 미분류 케이스 (섹션이 있을 때만 별도 표시) */}
              {(sections.length > 0 || uncategorizedCases.length > 0) && uncategorizedCases.length > 0 && (
                <div className="bg-bg-2 border-line-2 rounded-4 overflow-hidden border">
                  <div className="border-line-2 flex items-center gap-2 border-b px-4 py-2.5">
                    <button
                      type="button"
                      className="flex flex-1 items-center gap-2 text-left"
                      onClick={() => toggleSection('__uncategorized__')}
                    >
                      {collapsedSections.has('__uncategorized__')
                        ? <ChevronRight className="text-text-3 h-4 w-4 shrink-0" />
                        : <ChevronDown className="text-text-3 h-4 w-4 shrink-0" />
                      }
                      <span className="typo-body2-heading text-text-3">미분류</span>
                      <span className="text-text-3 text-xs">{uncategorizedCases.length}개</span>
                    </button>
                  </div>
                  {!collapsedSections.has('__uncategorized__') && (
                    <div className="divide-line-2 divide-y">
                      {uncategorizedCases.map((testCase: TestCaseCardType) => {
                        const statusConfig = TEST_STATUS_CONFIG[testCase.resultStatus] ?? TEST_STATUS_CONFIG.untested;
                        return (
                          <button
                            key={testCase.id}
                            type="button"
                            className="hover:bg-bg-3 flex w-full items-center justify-between px-4 py-3 text-left transition-colors"
                            onClick={() => setSelectedTestCaseId(testCase.id)}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-primary font-mono text-sm">{testCase.caseKey}</span>
                              <span className="text-text-1">{testCase.title}</span>
                              <div className="flex gap-1">
                                {testCase.tags.slice(0, 2).map((tag: string) => (
                                  <span key={tag} className="bg-bg-3 text-text-3 rounded px-1.5 py-0.5 text-xs">{tag}</span>
                                ))}
                              </div>
                            </div>
                            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', statusConfig.style)}>
                              {statusConfig.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 섹션이 없고 케이스만 있는 경우 (기존 플랫 구조) */}
              {sections.length === 0 && uncategorizedCases.length === 0 && testCases.length > 0 && (
                <div className="bg-bg-2 border-line-2 rounded-4 divide-line-2 divide-y border">
                  {testCases.map((testCase: TestCaseCardType) => {
                    const statusConfig = TEST_STATUS_CONFIG[testCase.resultStatus] ?? TEST_STATUS_CONFIG.untested;
                    return (
                      <button
                        key={testCase.id}
                        type="button"
                        className="hover:bg-bg-3 flex w-full items-center justify-between px-4 py-3 text-left transition-colors"
                        onClick={() => setSelectedTestCaseId(testCase.id)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-primary font-mono text-sm">{testCase.caseKey}</span>
                          <span className="text-text-1">{testCase.title}</span>
                          <div className="flex gap-1">
                            {testCase.tags.slice(0, 2).map((tag: string) => (
                              <span key={tag} className="bg-bg-3 text-text-3 rounded px-1.5 py-0.5 text-xs">{tag}</span>
                            ))}
                          </div>
                        </div>
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', statusConfig.style)}>
                          {statusConfig.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>

        {/* 최근 실행 이력 */}
        <section className="col-span-6 flex flex-col gap-4">
          <h2 className="typo-h2-heading">최근 실행 이력</h2>

          {suite.recentRuns.length === 0 ? (
            <div className="bg-bg-2 border-line-2 rounded-4 border-2 border-dashed">
              <EmptyState
                icon={<PlayCircle className="h-8 w-8" />}
                title="테스트 실행 이력이 없습니다."
                description="스위트 기반 테스트 실행을 생성하세요."
              />
            </div>
          ) : (
            <div className="bg-bg-2 border-line-2 rounded-4 divide-line-2 divide-y border">
              {suite.recentRuns.map((run) => {
                const runStatusConfig = RUN_STATUS_CONFIG[run.status] ?? RUN_STATUS_CONFIG.not_run;
                const runPassRate = run.total > 0 ? Math.round((run.passed / run.total) * 100) : 0;
                return (
                  <div
                    key={run.runId}
                    className="hover:bg-bg-3 flex items-center justify-between px-4 py-3 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          runStatusConfig.style
                        )}
                      >
                        {runStatusConfig.label}
                      </span>
                      <span className="text-text-2">{formatDateTime(run.runAt)}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-green-400">{run.passed} passed</span>
                        <span className="text-red-400">{run.failed} failed</span>
                        <span className="text-amber-400">{run.blocked} blocked</span>
                      </div>
                      <div className="w-20">
                        <div className="bg-bg-3 h-2 w-full rounded-full">
                          <div
                            className="bg-primary h-full rounded-full"
                            style={{ width: `${runPassRate}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-text-3 w-12 text-right text-sm">{runPassRate}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
        {isEditing && suite && <SuiteEditForm suite={suite} onClose={() => setIsEditing(false)} />}
        {isAddingCases && suite && (
          <AddCasesToSuiteModal
            suiteId={suite.id}
            suiteName={suite.title}
            availableCases={allCases.filter((tc: TestCase) => tc.testSuiteId !== suite.id)}
            onClose={() => setIsAddingCases(false)}
          />
        )}
        <AnimatePresence>
          {selectedTestCaseId && (
            <TestCaseSideView
              testCase={allCases.find((tc: TestCase) => tc.id === selectedTestCaseId)}
              onClose={() => setSelectedTestCaseId(null)}
            />
          )}
        </AnimatePresence>
      </MainContainer>
    </Container>
  );
};

export default TestSuiteDetailView;
