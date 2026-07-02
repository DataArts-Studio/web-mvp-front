'use client';
import React from 'react';

import { useParams } from 'next/navigation';

import { projectIdQueryOptions } from '@/entities/project';
import {
  type AutomationStatus,
  useAutomationCandidates,
  useAutomationCoverage,
  useSetAutomationStatus,
} from '@/features/automation-candidates';
import { useQuery } from '@tanstack/react-query';
import { DSButton, MainContainer } from '@testea/ui';
import { toast } from 'sonner';

import {
  AutomationLoadingSkeleton,
  BacklogSection,
  CandidateListSection,
  ColdStartEmpty,
  CoverageSection,
  FlakySection,
  SuitePrioritySection,
} from './_components';

export const AutomationView = () => {
  const params = useParams();
  const projectSlug = params.slug as string;

  const { data: projectIdData } = useQuery(projectIdQueryOptions(projectSlug));
  const projectId = projectIdData?.success ? projectIdData.data.id : undefined;

  const {
    data: candidatesData,
    isLoading: isLoadingCandidates,
    refetch: refetchCandidates,
  } = useAutomationCandidates(projectId);
  const {
    data: coverageData,
    isLoading: isLoadingCoverage,
    refetch: refetchCoverage,
  } = useAutomationCoverage(projectId);

  const setStatus = useSetAutomationStatus(projectId ?? '');

  const handleSetStatus = (caseId: string, status: AutomationStatus) => {
    setStatus.mutate(
      { caseId, status },
      {
        onSuccess: (result) => {
          if (result.success) {
            const label =
              status === 'candidate'
                ? '자동화 대상으로 지정했습니다.'
                : status === 'automated'
                  ? '자동화 완료로 표시했습니다.'
                  : '후보에서 해제했습니다.';
            toast.success(label);
          } else {
            toast.error(Object.values(result.errors).flat().join(', '));
          }
        },
        onError: () => toast.error('상태 변경 중 오류가 발생했습니다.'),
      }
    );
  };

  if (!projectId || isLoadingCandidates || isLoadingCoverage) {
    return <AutomationLoadingSkeleton />;
  }

  const candidatesResult = candidatesData?.success ? candidatesData.data : null;
  const coverageResult = coverageData?.success ? coverageData.data : null;

  if (!candidatesResult || !coverageResult) {
    return (
      <MainContainer className="mx-auto flex min-h-screen w-full max-w-[1180px] flex-1 flex-col gap-4 px-4 py-4">
        <header className="border-line-3/70 border-b pb-3">
          <h2 className="text-text-1 text-xl leading-7 font-semibold">자동화 후보</h2>
        </header>
        <section className="border-line-3/40 flex flex-col items-start gap-3 border-t py-6">
          <p className="text-text-1 text-sm font-semibold">자동화 데이터를 불러오지 못했습니다.</p>
          <p className="text-text-3 text-sm">
            잠시 후 다시 시도해 주세요. 문제가 계속되면 관리자에게 문의하세요.
          </p>
          <DSButton
            variant="ghost"
            size="small"
            onClick={() => {
              refetchCandidates();
              refetchCoverage();
            }}
          >
            다시 시도
          </DSButton>
        </section>
      </MainContainer>
    );
  }

  const { candidates, flaky } = candidatesResult;
  const recommendedCandidates = candidates.filter((row) => row.automationStatus === 'manual');
  const backlog = candidates.filter((row) => row.automationStatus === 'candidate');
  const pendingCaseId = setStatus.isPending ? (setStatus.variables?.caseId ?? null) : null;
  const isColdStart = candidates.length === 0 && flaky.length === 0;

  return (
    <MainContainer className="mx-auto grid min-h-screen w-full max-w-[1180px] flex-1 grid-cols-6 content-start gap-x-5 gap-y-5 px-4 py-4">
      <header className="border-line-3/70 col-span-6 flex items-baseline gap-2 border-b pb-3">
        <h2 className="text-text-1 text-xl leading-7 font-semibold">자동화 후보</h2>
        <span className="text-text-4 text-sm">
          추천 {recommendedCandidates.length}개 · 백로그 {backlog.length}개
        </span>
      </header>

      <CoverageSection coverage={coverageResult} />

      {isColdStart ? (
        <ColdStartEmpty projectSlug={projectSlug} />
      ) : (
        <>
          <div className="col-span-6 grid grid-cols-6 gap-x-5 gap-y-5">
            {recommendedCandidates.length > 0 && (
              <CandidateListSection
                candidates={recommendedCandidates}
                pendingCaseId={pendingCaseId}
                onSetStatus={handleSetStatus}
              />
            )}
            <BacklogSection
              backlog={backlog}
              pendingCaseId={pendingCaseId}
              onSetStatus={handleSetStatus}
            />
          </div>
          <SuitePrioritySection coverage={coverageResult} candidates={candidates} flaky={flaky} />
          {flaky.length > 0 && <FlakySection flaky={flaky} />}
        </>
      )}
    </MainContainer>
  );
};
