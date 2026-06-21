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
  CandidateListSection,
  ColdStartEmpty,
  CoverageSection,
  FlakySection,
} from './_components';

export const AutomationView = () => {
  const params = useParams();
  const projectSlug = params.slug as string;

  // slug → projectId
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

  // 로딩
  if (!projectId || isLoadingCandidates || isLoadingCoverage) {
    return <AutomationLoadingSkeleton />;
  }

  const candidatesResult = candidatesData?.success ? candidatesData.data : null;
  const coverageResult = coverageData?.success ? coverageData.data : null;

  // 에러 (조회 실패): 마이그레이션 미적용 등으로 데이터 조회가 실패해도 화면이 깨지지 않게 방어.
  if (!candidatesResult || !coverageResult) {
    return (
      <MainContainer className="mx-auto grid min-h-screen w-full max-w-[1200px] flex-1 grid-cols-6 content-start gap-x-5 gap-y-8 px-10 py-8">
        <header className="border-line-2 col-span-6 flex flex-col gap-1 border-b pb-6">
          <h2 className="typo-h1-heading text-text-1">자동화 후보</h2>
          <p className="typo-body2-normal text-text-2">
            자동화 효과가 큰 케이스를 추천하고 커버리지를 추적합니다.
          </p>
        </header>
        <section className="rounded-4 border-line-2 bg-bg-2 col-span-6 flex flex-col items-center gap-4 border border-dashed py-12 text-center">
          <p className="text-text-1 font-semibold">자동화 데이터를 불러오지 못했습니다.</p>
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
  // 후보·플래키가 모두 없으면(이력이 적든, 기준 통과 케이스가 없든) 빈 화면 대신 안내를 노출한다.
  const isColdStart = candidates.length === 0 && flaky.length === 0;

  return (
    <MainContainer className="mx-auto grid min-h-screen w-full max-w-[1200px] flex-1 grid-cols-6 content-start gap-x-5 gap-y-8 px-10 py-8">
      <header className="border-line-2 col-span-6 flex flex-col gap-1 border-b pb-6">
        <h2 className="typo-h1-heading text-text-1">자동화 후보</h2>
        <p className="typo-body2-normal text-text-2">
          자동화 효과가 큰 케이스를 추천하고 커버리지를 추적합니다.
        </p>
      </header>

      <CoverageSection coverage={coverageResult} />

      {isColdStart ? (
        <ColdStartEmpty projectSlug={projectSlug} />
      ) : (
        <>
          {candidates.length > 0 && (
            <CandidateListSection
              candidates={candidates}
              pendingCaseId={setStatus.isPending ? (setStatus.variables?.caseId ?? null) : null}
              onSetStatus={handleSetStatus}
            />
          )}
          {flaky.length > 0 && <FlakySection flaky={flaky} />}
        </>
      )}
    </MainContainer>
  );
};
