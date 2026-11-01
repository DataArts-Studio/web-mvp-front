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
import {
  suiteCaseRecentResultsQueryOptions,
  testSuiteByIdQueryOptions,
} from '@/entities/test-suite/api/query';
import { AddCasesToSuiteModal, SuiteEditForm } from '@/features/suites-edit';
import { TESTSUITE_EVENTS, track } from '@/shared/lib/analytics';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MainContainer } from '@testea/ui';
import { LoadingSpinner } from '@testea/ui';
import { toast } from 'sonner';

import { SuiteCaseListSection } from './_components/suite-case-list-section';
import { SuiteDetailAside } from './_components/suite-detail-aside';
import { SuiteDetailHeader } from './_components/suite-detail-header';
import { SuiteRunSummary } from './_components/suite-run-summary';

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

  // 케이스별 최근 결과 (행의 결과 칸, 주의할 케이스)
  const { data: recentResultsResult } = useQuery({
    ...suiteCaseRecentResultsQueryOptions(suiteId),
    enabled: !!suiteId,
  });
  const recentResults = recentResultsResult?.success ? recentResultsResult.data : {};

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
      recentResults: recentResults[tc.id] ?? [],
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

  return (
    <MainContainer className="flex min-h-screen w-full flex-1 flex-col lg:h-screen lg:overflow-hidden">
      <div className="border-line-2 flex shrink-0 flex-col gap-4 border-b px-4 pt-5 pb-5 md:px-8">
        <SuiteDetailHeader
          suite={suite}
          projectSlug={params.slug as string}
          onEdit={() => setIsEditing(true)}
          onArchived={() => router.push(`/projects/${params.slug}/suites`)}
        />
        <SuiteRunSummary suite={suite} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="min-w-0 flex-1 px-4 py-5 md:px-8 lg:overflow-y-auto">
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
        </div>

        <div className="border-line-2 shrink-0 border-t px-4 py-5 md:px-8 lg:w-[320px] lg:overflow-y-auto lg:border-t-0 lg:border-l lg:px-5">
          <SuiteDetailAside
            suite={suite}
            projectSlug={params.slug as string}
            sectionCount={sections.length}
            cases={testCases}
            onSelectCase={setSelectedTestCaseId}
          />
        </div>
      </div>

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
