'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { getTestTypeLabel, parseSteps } from '@/entities/test-case';
import { testCaseByIdQueryOptions } from '@/features/cases-list';
import { ArchiveButton } from '@/features/archive/ui/archive-button';
import { TestCaseEditForm } from '@/features/cases-edit';
import { VersionHistoryTab } from '@/features/version-timeline';
import { testSuitesQueryOptions } from '@/widgets';
import { MainContainer, DSButton, LoadingSpinner } from '@testea/ui';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Clock, Edit2, Flag, FolderOpen, History, Play, Tag, XCircle } from 'lucide-react';
import { track, TESTCASE_EVENTS } from '@/shared/lib/analytics';
import { formatDateTime } from '@testea/util';
import { AttachmentSection } from '@/features/attachments';
import { ExternalLinksSection } from '@/features/github-links';

type DetailTab = 'details' | 'versions';

export const TestCaseDetailView = () => {
  const params = useParams();
  const router = useRouter();
  const caseId = params.caseId as string;
  const projectSlug = params.slug as string;
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>('details');

  const { data, isLoading, isError } = useQuery(testCaseByIdQueryOptions(caseId));

  const testCase = data?.success ? data.data : null;

  React.useEffect(() => {
    if (testCase) {
      track(TESTCASE_EVENTS.DETAIL_VIEW, { case_id: caseId });
    }
  }, [testCase, caseId]);

  const { data: suitesData } = useQuery({
    ...testSuitesQueryOptions(testCase?.projectId || ''),
    enabled: !!testCase?.projectId,
  });
  const suites = suitesData?.success ? suitesData.data : [];
  const currentSuite = suites.find(s => s.id === testCase?.testSuiteId);

  const handleRunTest = () => {
    router.push(`/projects/${projectSlug}/runs/create`);
  };

  if (isLoading) {
    return (
      <MainContainer className="flex flex-1 items-center justify-center">
        <LoadingSpinner size="lg" />
      </MainContainer>
    );
  }

  if (isError || !data?.success || !testCase) {
    return (
      <MainContainer className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <XCircle className="h-12 w-12 text-red-400" />
          <p className="text-text-1 font-semibold">테스트 케이스를 불러올 수 없습니다.</p>
          <Link href={`/projects/${projectSlug}/cases`} className="text-primary hover:underline">
            목록으로 돌아가기
          </Link>
        </div>
      </MainContainer>
    );
  }

  return (
      <MainContainer className="mx-auto grid min-h-screen w-full max-w-[1200px] flex-1 grid-cols-6 content-start gap-x-5 gap-y-6 px-10 py-8">
        {/* 뒤로가기 + 헤더 */}
        <header className="col-span-6 flex flex-col gap-4">
          <Link
            href={`/projects/${projectSlug}/cases`}
            className="text-text-3 hover:text-text-1 flex w-fit items-center gap-1 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            테스트 케이스 목록으로
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="text-primary text-xl font-semibold">{testCase.caseKey}</span>
                <h1 className="typo-title-heading">{testCase.title}</h1>
              </div>
            </div>

            <div className="flex gap-2">
              <DSButton variant="ghost" className="flex items-center gap-2" onClick={() => setIsEditing(true)}>
                <Edit2 className="h-4 w-4" />
                수정
              </DSButton>
              <ArchiveButton
                targetType="case"
                targetId={testCase.id}
                onSuccess={() => router.push(`/projects/${projectSlug}/cases`)}
              />
            </div>
          </div>
        </header>

        {/* 메타 정보 */}
        <section className="col-span-6 flex flex-wrap items-center gap-4">
          <div className="text-text-3 flex items-center gap-1.5 text-sm">
            <FolderOpen className="h-4 w-4" strokeWidth={1.5} />
            <span>{currentSuite?.title || '스위트 없음'}</span>
          </div>
          <div className="text-text-3 flex items-center gap-1.5 text-sm">
            <Flag className="h-4 w-4" strokeWidth={1.5} />
            <span>{testCase.testType ? getTestTypeLabel(testCase.testType) : '-'}</span>
          </div>
          <div className="text-text-3 flex items-center gap-1.5 text-sm">
            <Calendar className="h-4 w-4" strokeWidth={1.5} />
            <span>생성: {formatDateTime(testCase.createdAt)}</span>
          </div>
          <div className="text-text-3 flex items-center gap-1.5 text-sm">
            <Clock className="h-4 w-4" strokeWidth={1.5} />
            <span>수정: {formatDateTime(testCase.updatedAt)}</span>
          </div>
        </section>

        {/* 탭 네비게이션 */}
        <nav className="col-span-6 border-line-2 flex gap-0 border-b">
          <button
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'details'
                ? 'text-primary border-primary border-b-2'
                : 'text-text-3 hover:text-text-1'
            }`}
            onClick={() => setActiveTab('details')}
          >
            상세 정보
          </button>
          <button
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'versions'
                ? 'text-primary border-primary border-b-2'
                : 'text-text-3 hover:text-text-1'
            }`}
            onClick={() => setActiveTab('versions')}
          >
            <History className="h-4 w-4" />
            변경 이력
          </button>
        </nav>

        {/* 탭 콘텐츠 */}
        {activeTab === 'details' && (
          <>
            {/* 태그 */}
            <section className="col-span-6 flex flex-wrap items-center gap-2">
              <span className="text-text-3 flex items-center gap-1 text-sm">
                <Tag className="h-4 w-4" />
                Tags
              </span>
              {testCase.tags && testCase.tags.length > 0 ? (
                testCase.tags.map((tag, index) => (
                  <span key={index} className="bg-bg-3 rounded-2 px-2 py-1 text-sm">
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-text-3 text-sm">태그 없음</span>
              )}
            </section>

            {/* 전제 조건 */}
            <section className="col-span-6 flex flex-col gap-2">
              <h2 className="typo-h2-heading">전제 조건</h2>
              <StepsList steps={testCase.preCondition} emptyText="전제 조건이 없습니다." />
            </section>

            {/* 테스트 단계 */}
            <section className="col-span-6 flex flex-col gap-2">
              <h2 className="typo-h2-heading">테스트 단계</h2>
              <StepsList steps={testCase.testSteps} emptyText="테스트 단계가 없습니다." />
            </section>

            {/* 예상 결과 */}
            <section className="col-span-6 flex flex-col gap-2">
              <h2 className="typo-h2-heading">예상 결과</h2>
              <StepsList steps={testCase.expectedResult} emptyText="예상 결과가 없습니다." />
            </section>

            {/* 첨부파일 */}
            <AttachmentSection testCaseId={testCase.id} projectId={testCase.projectId} />

            {/* GitHub 연결 */}
            <section className="col-span-6 flex flex-col gap-2">
              <ExternalLinksSection
                testCaseId={testCase.id}
                projectId={testCase.projectId}
                testCaseName={testCase.title}
                displayId={testCase.displayId}
                resultStatus={testCase.resultStatus}
              />
            </section>

            {/* 액션 버튼 */}
            <section className="col-span-6">
              <DSButton className="flex items-center gap-2" onClick={handleRunTest}>
                <Play className="h-4 w-4" />
                테스트 실행 생성
              </DSButton>
            </section>
          </>
        )}

        {activeTab === 'versions' && (
          <VersionHistoryTab testCaseId={testCase.id} />
        )}

        {isEditing && (
          <TestCaseEditForm
            testCase={testCase}
            onClose={() => setIsEditing(false)}
          />
        )}
      </MainContainer>
  );
};

function StepsList({ steps, emptyText = '항목이 없습니다.' }: { steps: string; emptyText?: string }) {
  const parsed = parseSteps(steps);
  const hasContent = parsed.some((s) => s.trim());

  if (!hasContent) {
    return (
      <div className="bg-bg-2 border-line-2 rounded-4 border p-4">
        <p className="text-text-2">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-2 border-line-2 rounded-4 overflow-hidden border">
      <ol className="divide-y divide-line-2">
        {parsed.map((step, i) => (
          <li key={i} className="flex items-start gap-3 px-4 py-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
              {i + 1}
            </span>
            <p className="text-sm text-text-1 whitespace-pre-wrap">{step || '-'}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
