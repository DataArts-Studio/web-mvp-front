'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { testCaseByIdQueryOptions } from '@/features';
import { ArchiveButton } from '@/features/archive/ui/archive-button';
import { TestCaseEditForm } from '@/features/cases-edit';
import { testSuitesQueryOptions } from '@/widgets';
import { Container, MainContainer } from '@/shared/lib';
import { DSButton, LoadingSpinner } from '@/shared/ui';
import { cn } from '@/shared/utils';
import { Aside } from '@/widgets';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Clock, Edit2, Flag, FolderOpen, Play, Tag, XCircle } from 'lucide-react';
import { track, TESTCASE_EVENTS } from '@/shared/lib/analytics';
import { formatDateTime } from '@/shared/utils/date-format';

const STATUS_CONFIG: Record<string, { label: string; style: string }> = {
  pass: { label: 'Pass', style: 'bg-green-500/20 text-green-300' },
  fail: { label: 'Fail', style: 'bg-red-500/20 text-red-300' },
  blocked: { label: 'Blocked', style: 'bg-amber-500/20 text-amber-300' },
  untested: { label: 'Untested', style: 'bg-slate-500/20 text-slate-300' },
};

export const TestCaseDetailView = () => {
  const params = useParams();
  const router = useRouter();
  const caseId = params.caseId as string;
  const projectSlug = params.slug as string;
  const [isEditing, setIsEditing] = useState(false);

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
      <Container className="bg-bg-1 text-text-1 flex min-h-screen font-sans">
        <Aside />
        <MainContainer className="flex flex-1 items-center justify-center">
          <LoadingSpinner size="lg" />
        </MainContainer>
      </Container>
    );
  }

  if (isError || !data?.success || !testCase) {
    return (
      <Container className="bg-bg-1 text-text-1 flex min-h-screen font-sans">
        <Aside />
        <MainContainer className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <XCircle className="h-12 w-12 text-red-400" />
            <p className="text-text-1 font-semibold">테스트 케이스를 불러올 수 없습니다.</p>
            <Link href={`/projects/${projectSlug}/cases`} className="text-primary hover:underline">
              목록으로 돌아가기
            </Link>
          </div>
        </MainContainer>
      </Container>
    );
  }

  const statusInfo = STATUS_CONFIG[testCase.resultStatus || 'untested'] || STATUS_CONFIG.untested;

  return (
    <Container className="bg-bg-1 text-text-1 flex min-h-screen font-sans">
      <Aside />
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
                <span className={cn('rounded-full px-3 py-1 text-sm font-medium', statusInfo.style)}>
                  {statusInfo.label}
                </span>
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
            <span>{testCase.testType || '-'}</span>
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
          <div className="bg-bg-2 border-line-2 rounded-4 border p-4">
            <p className="text-text-2 whitespace-pre-wrap">{testCase.preCondition || '전제 조건이 없습니다.'}</p>
          </div>
        </section>

        {/* 테스트 단계 */}
        <section className="col-span-6 flex flex-col gap-2">
          <h2 className="typo-h2-heading">테스트 단계</h2>
          <div className="bg-bg-2 border-line-2 rounded-4 border p-4">
            <p className="text-text-2 whitespace-pre-wrap">{testCase.testSteps || '테스트 단계가 없습니다.'}</p>
          </div>
        </section>

        {/* 예상 결과 */}
        <section className="col-span-6 flex flex-col gap-2">
          <h2 className="typo-h2-heading">예상 결과</h2>
          <div className="bg-bg-2 border-line-2 rounded-4 border p-4">
            <p className="text-text-2 whitespace-pre-wrap">{testCase.expectedResult || '예상 결과가 없습니다.'}</p>
          </div>
        </section>

        {/* 액션 버튼 */}
        <section className="col-span-6">
          <DSButton className="flex items-center gap-2" onClick={handleRunTest}>
            <Play className="h-4 w-4" />
            테스트 실행 생성
          </DSButton>
        </section>

        {isEditing && (
          <TestCaseEditForm
            testCase={testCase}
            onClose={() => setIsEditing(false)}
          />
        )}
      </MainContainer>
    </Container>
  );
};
