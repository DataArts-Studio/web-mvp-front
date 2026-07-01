'use client';

import React, { useRef, useState } from 'react';

import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import type { TestCase, TestCaseCardType } from '@/entities/test-case';
import { getTestCases } from '@/entities/test-case/api/server-actions';
import type { TestSuiteCard } from '@/entities/test-suite';
import {
  createSection,
  deleteSection,
  suiteSectionsQueryOptions,
  updateSection,
} from '@/entities/test-suite-section';
import type { TestSuiteSection } from '@/entities/test-suite-section';
import { testSuiteByIdQueryOptions } from '@/entities/test-suite/api/query';
import { ArchiveButton } from '@/features/archive/ui/archive-button';
import { AddCasesToSuiteModal, SuiteEditForm } from '@/features/suites-edit';
import { TESTSUITE_EVENTS, track } from '@/shared/lib/analytics';
import { LastRunFreshnessLabel } from '@/shared/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MainContainer } from '@testea/ui';
import { DSButton, LoadingSpinner } from '@testea/ui';
import { cn } from '@testea/util';
import { formatDate } from '@testea/util';
import { ArrowLeft, Calendar, Edit2, FolderTree, Tag } from 'lucide-react';
import { toast } from 'sonner';

import { SuiteCaseListSection } from './_components/suite-case-list-section';
import { TAG_TONE_CONFIG } from './_components/suite-detail-constants';
import { SuiteLastRunSection } from './_components/suite-last-run-section';
import { SuiteRecentRuns } from './_components/suite-recent-runs';
import { SuiteStatsSection } from './_components/suite-stats-section';

const AnimatePresence = dynamic(
  () => import('framer-motion').then((mod) => ({ default: mod.AnimatePresence })),
  { ssr: false }
);

const TestCaseSideView = dynamic(
  () =>
    import('@/view/project/cases/test-case-side-view').then((mod) => ({
      default: mod.TestCaseSideView,
    })),
  { ssr: false }
);

const TestSuiteDetailView = () => {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('suites');
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
  const [createSectionError, setCreateSectionError] = useState<string | null>(null);
  const newSectionInputRef = useRef<HTMLInputElement>(null);
  const editSectionInputRef = useRef<HTMLInputElement>(null);

  // 실제 API로 스위트 데이터 조회 (통계 포함)
  const { data: suiteResult, isLoading: isSuiteLoading } = useQuery(
    testSuiteByIdQueryOptions(suiteId)
  );

  // 해당 프로젝트의 테스트 케이스 조회
  const projectId = suiteResult?.success ? (suiteResult.data?.projectId ?? '') : '';
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
  const invalidateSections = () =>
    queryClient.invalidateQueries({ queryKey: ['suiteSections', suiteId] });

  const createSectionMutation = useMutation({
    mutationFn: (name: string) => createSection({ suiteId, name }),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('섹션이 생성되었습니다.');
        invalidateSections();
        setIsCreatingSection(false);
        setNewSectionName('');
      } else {
        const msg = Object.values(result.errors ?? {})
          .flat()
          .join(', ');
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
        const msg = Object.values(result.errors ?? {})
          .flat()
          .join(', ');
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
      <MainContainer className="flex flex-1 items-center justify-center">
        <LoadingSpinner size="lg" />
      </MainContainer>
    );
  }

  // 해당 스위트에 속한 테스트 케이스 필터링
  const allCases = casesResult?.success ? (casesResult.data ?? []) : [];
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
    if (!name) {
      setCreateSectionError('섹션 이름을 입력해주세요.');
      return;
    }
    if (name.length > 100) {
      setCreateSectionError('섹션 이름은 100자를 초과할 수 없습니다.');
      return;
    }
    const isDuplicate = sections.some((s) => s.name === name);
    if (isDuplicate) {
      setCreateSectionError('이미 존재하는 섹션 이름입니다.');
      return;
    }
    setCreateSectionError(null);
    createSectionMutation.mutate(name);
  };

  const handleRenameSection = (sectionId: string) => {
    const name = editingSectionName.trim();
    if (!name) {
      toast.error('섹션 이름을 입력해주세요.');
      return;
    }
    if (name.length > 100) {
      toast.error('섹션 이름은 100자를 초과할 수 없습니다.');
      return;
    }
    // 중복 이름 확인 (자기 자신 제외)
    const isDuplicate = sections.some((s) => s.id !== sectionId && s.name === name);
    if (isDuplicate) {
      toast.error('이미 존재하는 섹션 이름입니다.');
      return;
    }
    updateSectionMutation.mutate({ id: sectionId, name });
  };

  const handleDeleteSection = (sectionId: string, caseCount: number) => {
    if (
      !confirm(
        `섹션을 삭제하시겠습니까?\n섹션만 삭제되며, 포함된 테스트 케이스 ${caseCount}개는 미분류로 이동됩니다.`
      )
    )
      return;
    deleteSectionMutation.mutate(sectionId);
  };

  if (!suite) {
    return (
      <MainContainer className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-text-1 font-semibold">{t('ui.notFound')}</p>
          <Link
            href={`/projects/${params.slug}/suites`}
            className="text-primary mt-4 inline-block hover:underline"
          >
            {t('ui.backToListLong')}
          </Link>
        </div>
      </MainContainer>
    );
  }

  const tagToneStyle =
    TAG_TONE_CONFIG[suite.tag?.tone ?? 'neutral']?.style ?? TAG_TONE_CONFIG.neutral.style;
  const tagToneLabelKey: Record<string, string> = {
    neutral: 'ui.tagNeutral',
    info: 'ui.tagInfo',
    success: 'ui.tagSuccess',
    warning: 'ui.tagWarning',
    danger: 'ui.tagDanger',
  };
  const tagLabel = t(tagToneLabelKey[suite.tag?.tone ?? 'neutral'] ?? 'ui.tagNeutral');

  return (
    <MainContainer className="grid min-h-screen w-full max-w-none flex-1 grid-cols-1 grid-rows-[auto_auto_auto] gap-x-7 px-5 py-5 lg:h-screen lg:grid-cols-[minmax(0,1fr)_340px] lg:grid-rows-[auto_minmax(0,1fr)] lg:overflow-hidden lg:px-8 lg:py-6">
      <header className="border-line-2 flex flex-col gap-4 border-b pb-4 lg:col-span-2 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            href={`/projects/${params.slug}/suites`}
            aria-label={t('ui.backToList')}
            className="border-line-2 text-text-3 hover:bg-bg-2 hover:text-text-1 focus-visible:ring-primary inline-flex h-9 w-9 shrink-0 items-center justify-center border transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-3">
              <h1 className="text-text-1 truncate text-[22px] leading-7 font-semibold tracking-normal">
                {suite.title}
              </h1>
              {suite.tag && (
                <span className={cn('shrink-0 px-2 py-0.5 text-xs font-medium', tagToneStyle)}>
                  {tagLabel}
                </span>
              )}
            </div>
            <div className="text-text-3 mt-1 flex min-w-0 items-center gap-4 text-xs">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" strokeWidth={1.7} aria-hidden="true" />
                {t('ui.createdAt', { date: formatDate(suite.createdAt) })}
              </span>
              {suite.linkedMilestone && (
                <Link
                  href={`/projects/${params.slug}/milestones/${suite.linkedMilestone.id}`}
                  className="hover:text-text-1 inline-flex min-w-0 items-center gap-1.5 transition-colors"
                >
                  <Tag className="h-3.5 w-3.5 shrink-0" strokeWidth={1.7} aria-hidden="true" />
                  <span className="truncate">
                    {suite.linkedMilestone.title} ({suite.linkedMilestone.versionLabel})
                  </span>
                </Link>
              )}
              <LastRunFreshnessLabel lastExecutedAt={suite.lastExecutedAt} />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <DSButton
            variant="ghost"
            className="flex h-9 items-center gap-2 px-3"
            onClick={() => setIsEditing(true)}
          >
            <Edit2 className="h-4 w-4" aria-hidden="true" />
            {t('ui.edit')}
          </DSButton>
          <ArchiveButton
            targetType="suite"
            targetId={suite.id}
            onSuccess={() => router.push(`/projects/${params.slug}/suites`)}
          />
        </div>
      </header>

      <main className="min-h-[520px] overflow-hidden py-5 lg:min-h-0">
        <SuiteCaseListSection
          sections={sections}
          testCases={testCases}
          casesBySection={casesBySection}
          uncategorizedCases={uncategorizedCases}
          collapsedSections={collapsedSections}
          editingSectionId={editingSectionId}
          editingSectionName={editingSectionName}
          menuOpenSectionId={menuOpenSectionId}
          isCreatingSection={isCreatingSection}
          newSectionName={newSectionName}
          createSectionIsPending={createSectionMutation.isPending}
          createSectionError={createSectionError}
          newSectionInputRef={newSectionInputRef}
          editSectionInputRef={editSectionInputRef}
          onToggleSection={toggleSection}
          onSetMenuOpenSectionId={setMenuOpenSectionId}
          onSetEditingSectionName={setEditingSectionName}
          onStartRename={(id, name) => {
            setEditingSectionId(id);
            setEditingSectionName(name);
          }}
          onRenameSection={handleRenameSection}
          onCancelRename={() => setEditingSectionId(null)}
          onDeleteSection={handleDeleteSection}
          onSelectTestCase={setSelectedTestCaseId}
          onStartCreatingSection={() => {
            setIsCreatingSection(true);
            setTimeout(() => newSectionInputRef.current?.focus(), 0);
          }}
          onSetNewSectionName={(name) => {
            setNewSectionName(name);
            setCreateSectionError(null);
          }}
          onCreateSection={handleCreateSection}
          onCancelCreateSection={() => {
            setIsCreatingSection(false);
            setNewSectionName('');
            setCreateSectionError(null);
          }}
          onAddCases={() => setIsAddingCases(true)}
        />
      </main>

      <aside className="border-line-2 flex min-h-0 flex-col gap-6 border-t py-5 lg:overflow-y-auto lg:border-t-0 lg:border-l lg:pl-6">
        <section className="border-line-2 border-b pb-5">
          <h2 className="text-text-3 mb-2 text-xs font-semibold tracking-wide uppercase">
            Summary
          </h2>
          <p className="text-text-2 text-sm leading-6">
            {suite.description || t('ui.noDescription')}
          </p>
        </section>

        {suite.includedPaths && suite.includedPaths.length > 0 && (
          <section className="border-line-2 border-b pb-5">
            <div className="mb-3 flex items-center gap-2">
              <FolderTree className="text-text-3 h-4 w-4" strokeWidth={1.7} aria-hidden="true" />
              <h2 className="text-text-3 text-xs font-semibold tracking-wide uppercase">
                {t('ui.includedPaths')}
              </h2>
            </div>
            <div className="flex flex-col gap-1.5">
              {suite.includedPaths.map((path, index) => (
                <code
                  key={index}
                  className="border-line-2 bg-bg-2 text-text-2 truncate border px-2 py-1.5 font-mono text-xs"
                  title={path}
                >
                  {path}
                </code>
              ))}
            </div>
          </section>
        )}

        <SuiteStatsSection suite={suite} />
        {suite.lastRun && <SuiteLastRunSection lastRun={suite.lastRun} />}
        <SuiteRecentRuns recentRuns={suite.recentRuns} />
      </aside>

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
  );
};

export default TestSuiteDetailView;
