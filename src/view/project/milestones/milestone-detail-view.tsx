'use client';

import React, { useState } from 'react';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getTestCases } from '@/entities/test-case/api';
import { milestoneByIdQueryOptions } from '@/features/milestones';
import { MilestoneEditForm, AddCasesToMilestoneModal, AddSuitesToMilestoneModal } from '@/features/milestones-edit';
import { ArchiveButton } from '@/features/archive/ui/archive-button';
import { MainContainer } from '@/shared/lib';
import { DSButton, StatusBadge, MILESTONE_STATUS_CONFIG, TEST_RESULT_STATUS_CONFIG, RUN_STATUS_CONFIG, EmptyState, Skeleton, SkeletonCircle } from '@/shared/ui';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, ChevronRight, Edit2, FolderOpen, ListChecks, Play, PlayCircle, Plus, XCircle } from 'lucide-react';
import { getTestSuites } from '@/entities/test-suite';
import { track, MILESTONE_EVENTS } from '@/shared/lib/analytics';
import { formatDateTime } from '@/shared/utils/date-format';

const AnimatePresence = dynamic(
  () => import('framer-motion').then((mod) => ({ default: mod.AnimatePresence })),
  { ssr: false }
);

const TestCaseSideView = dynamic(
  () => import('@/view/project/cases/test-case-side-view').then((mod) => ({ default: mod.TestCaseSideView })),
  { ssr: false }
);



export const MilestoneDetailView = () => {
  const params = useParams();
  const router = useRouter();
  const milestoneId = params.milestoneId as string;
  const projectSlug = params.slug as string;
  const [isEditing, setIsEditing] = useState(false);

  const { data, isLoading, isError } = useQuery(milestoneByIdQueryOptions(milestoneId));
  const [isAddingCases, setIsAddingCases] = useState(false);
  const [isAddingSuites, setIsAddingSuites] = useState(false);
  const [selectedTestCaseId, setSelectedTestCaseId] = useState<string | null>(null);

  React.useEffect(() => {
    if (data?.success) {
      track(MILESTONE_EVENTS.DETAIL_VIEW, { milestone_id: milestoneId });
    }
  }, [data?.success, milestoneId]);

  // 프로젝트의 테스트 케이스 조회
  const { data: casesResult } = useQuery({
    queryKey: ['testCases', 'forMilestone', milestoneId],
    queryFn: () => getTestCases({ project_id: data?.success ? data.data.projectId : '' }),
    enabled: !!(data?.success && data.data.projectId),
  });

  const allCases = casesResult?.success ? casesResult.data ?? [] : [];

  // 프로젝트의 테스트 스위트 조회
  const { data: suitesResult } = useQuery({
    queryKey: ['testSuites', 'forMilestone', milestoneId],
    queryFn: () => getTestSuites({ projectId: data?.success ? data.data.projectId : '' }),
    enabled: !!(data?.success && data.data.projectId),
  });

  const allSuites = suitesResult?.success ? suitesResult.data ?? [] : [];

  const handleRunTest = () => {
    router.push(`/projects/${projectSlug}/runs/create?milestoneId=${milestoneId}`);
  };

  if (isLoading) {
    return (
      <MainContainer className="mx-auto grid min-h-screen w-full max-w-[1200px] flex-1 grid-cols-6 content-start gap-x-5 gap-y-6 px-10 py-8">
        {/* Header skeleton */}
        <header className="col-span-6 flex flex-col gap-4">
          <Skeleton className="h-4 w-32" />
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-64" />
                <SkeletonCircle className="h-7 w-16" />
              </div>
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-9 w-16" />
            </div>
          </div>
        </header>
        {/* Description skeleton */}
        <section className="col-span-6">
          <div className="bg-bg-2 border-line-2 rounded-4 border p-4">
            <Skeleton className="h-5 w-full" />
          </div>
        </section>
        {/* Stats skeleton */}
        <section className="col-span-6 grid grid-cols-4 gap-4">
          <div className="bg-bg-2 border-line-2 rounded-4 col-span-2 border p-4">
            <Skeleton className="h-20" />
          </div>
          <div className="bg-bg-2 border-line-2 rounded-4 border p-4">
            <Skeleton className="h-12" />
          </div>
          <div className="bg-bg-2 border-line-2 rounded-4 border p-4">
            <Skeleton className="h-12" />
          </div>
        </section>
        {/* Test cases skeleton */}
        <section className="col-span-6 flex flex-col gap-4">
          <Skeleton className="h-6 w-48" />
          <div className="bg-bg-2 border-line-2 rounded-4 divide-line-2 divide-y border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <SkeletonCircle className="h-5 w-16" />
              </div>
            ))}
          </div>
        </section>
      </MainContainer>
    );
  }

  if (isError || !data?.success) {
    return (
      <MainContainer className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <XCircle className="h-12 w-12 text-red-400" />
          <p className="text-text-1 font-semibold">마일스톤을 불러올 수 없습니다.</p>
          <Link href={`/projects/${projectSlug}/milestones`} className="text-primary hover:underline">
            목록으로 돌아가기
          </Link>
        </div>
      </MainContainer>
    );
  }

  const milestone = data.data;
  const statusInfo = MILESTONE_STATUS_CONFIG[milestone.progressStatus] || {
    label: milestone.progressStatus,
    style: 'bg-gray-500/20 text-gray-300',
  };

  const stats = { progressRate: milestone.progressRate, completedCases: milestone.completedCases, totalCases: milestone.totalCases, runCount: milestone.runCount };
  const testCases = milestone.testCases ?? [];
  const testSuites = milestone.testSuites ?? [];
  const testRuns = milestone.testRuns ?? [];

  return (
    <MainContainer className="mx-auto grid min-h-screen w-full max-w-[1200px] flex-1 grid-cols-6 content-start gap-x-5 gap-y-6 px-10 py-8">
        {/* 뒤로가기 + 헤더 */}
        <header className="col-span-6 flex flex-col gap-4">
          <Link
            href={`/projects/${projectSlug}/milestones`}
            className="text-text-3 hover:text-text-1 flex w-fit items-center gap-1 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            마일스톤 목록으로
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <h1 className="typo-title-heading">{milestone.title}</h1>
                <StatusBadge config={statusInfo} className="px-3 py-1 text-sm" />
              </div>
              <div className="text-text-3 flex items-center gap-1.5 text-sm">
                <Calendar className="h-4 w-4" strokeWidth={1.5} />
                <span>
                  {formatDateTime(milestone.startDate)} ~ {formatDateTime(milestone.endDate)}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <DSButton variant="ghost" className="flex items-center gap-2" onClick={() => setIsEditing(true)}>
                <Edit2 className="h-4 w-4" />
                수정
              </DSButton>
              <ArchiveButton targetType='milestone' targetId={milestoneId} onSuccess={() => router.push(`/projects/${projectSlug}/milestones`)}/>
            </div>
          </div>
        </header>

        {/* 설명 */}
        <section className="col-span-6">
          <div className="bg-bg-2 border-line-2 rounded-4 border p-4">
            <p className="text-text-2">{milestone.description || '설명이 없습니다.'}</p>
          </div>
        </section>

        {/* 진행률 + 통계 */}
        <section className="col-span-6 grid grid-cols-4 gap-4">
          {/* 진행률 */}
          <div className="bg-bg-2 border-line-2 rounded-4 col-span-2 border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-text-3 font-semibold">진행률</h3>
              <span className="text-primary text-2xl font-bold">{stats.progressRate}%</span>
            </div>
            <div className="bg-bg-3 h-3 w-full rounded-full">
              <div
                className="bg-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${stats.progressRate}%` }}
              />
            </div>
            <p className="text-text-3 mt-2 text-sm">
              {stats.completedCases} / {stats.totalCases} 케이스 완료
            </p>
          </div>

          {/* 통계 카드들 */}
          <div className="bg-bg-2 border-line-2 rounded-4 flex flex-col gap-1 border p-4">
            <div className="text-text-3 flex items-center gap-1.5 text-sm">
              <ListChecks className="h-4 w-4" strokeWidth={1.5} />
              <span>테스트 케이스</span>
            </div>
            <span className="text-text-1 text-2xl font-bold">{stats.totalCases}개</span>
          </div>

          <div className="bg-bg-2 border-line-2 rounded-4 flex flex-col gap-1 border p-4">
            <div className="text-text-3 flex items-center gap-1.5 text-sm">
              <PlayCircle className="h-4 w-4" strokeWidth={1.5} />
              <span>테스트 실행</span>
            </div>
            <span className="text-text-1 text-2xl font-bold">{stats.runCount}회</span>
          </div>
        </section>

        {/* 테스트 실행 생성 버튼 */}
        <section className="col-span-6">
          <DSButton className="flex items-center gap-2" onClick={handleRunTest}>
            <Play className="h-4 w-4" />
            마일스톤 기반 테스트 실행 생성
          </DSButton>
        </section>

        {/* 테스트 케이스 목록 */}
        <section className="col-span-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="typo-h2-heading">포함된 테스트 케이스</h2>
            {testCases.length > 0 && (
              <DSButton
                variant="ghost"
                size="small"
                className="flex items-center gap-1"
                onClick={() => setIsAddingCases(true)}
              >
                <Plus className="h-4 w-4" />
                케이스 추가
              </DSButton>
            )}
          </div>

          {testCases.length === 0 ? (
            <div className="bg-bg-2 border-line-2 rounded-4 border-2 border-dashed">
              <EmptyState
                icon={<ListChecks className="h-8 w-8" />}
                title="포함된 테스트 케이스가 없습니다."
                description="테스트 케이스를 추가하여 마일스톤 범위를 정의하세요."
                action={
                  <DSButton
                    variant="ghost"
                    className="flex items-center gap-1"
                    onClick={() => setIsAddingCases(true)}
                  >
                    <Plus className="h-4 w-4" />
                    테스트 케이스 추가
                  </DSButton>
                }
              />
            </div>
          ) : (
            <div className="bg-bg-2 border-line-2 rounded-4 divide-line-2 divide-y border">
              {testCases.map((testCase) => {
                const statusConfig =
                  TEST_RESULT_STATUS_CONFIG[testCase.lastStatus || 'untested'] ||
                  TEST_RESULT_STATUS_CONFIG.untested;
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
                    </div>
                    <StatusBadge config={statusConfig} />
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* 테스트 스위트 목록 */}
        <section className="col-span-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="typo-h2-heading">포함된 테스트 스위트</h2>
            {testSuites.length > 0 && (
              <DSButton
                variant="ghost"
                size="small"
                className="flex items-center gap-1"
                onClick={() => setIsAddingSuites(true)}
              >
                <Plus className="h-4 w-4" />
                스위트 추가
              </DSButton>
            )}
          </div>

          {testSuites.length === 0 ? (
            <div className="bg-bg-2 border-line-2 rounded-4 border-2 border-dashed">
              <EmptyState
                icon={<ListChecks className="h-8 w-8" />}
                title="포함된 테스트 스위트가 없습니다."
                description="테스트 스위트를 추가하여 마일스톤 범위를 정의하세요."
                action={
                  <DSButton
                    variant="ghost"
                    className="flex items-center gap-1"
                    onClick={() => setIsAddingSuites(true)}
                  >
                    <Plus className="h-4 w-4" />
                    테스트 스위트 추가
                  </DSButton>
                }
              />
            </div>
          ) : (
            <div className="bg-bg-2 border-line-2 rounded-4 divide-line-2 divide-y border">
              {testSuites.map((suite) => {
                const suiteCaseCount = testCases.filter((tc) => tc.id && allCases.some((ac) => ac.id === tc.id && ac.testSuiteId === suite.id)).length;
                return (
                  <Link
                    key={suite.id}
                    href={`/projects/${projectSlug}/suites/${suite.id}`}
                    className="hover:bg-bg-3 flex items-center justify-between px-4 py-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FolderOpen className="text-text-3 h-4 w-4 shrink-0" />
                      <div className="flex flex-col gap-1">
                        <span className="text-text-1">{suite.title}</span>
                        {suite.description && (
                          <span className="text-text-3 text-sm">{suite.description}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-text-3 text-sm">{suiteCaseCount}개 케이스</span>
                      <ChevronRight className="text-text-3 h-4 w-4" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* 테스트 실행 이력 */}
        <section className="col-span-6 flex flex-col gap-4">
          <h2 className="typo-h2-heading">테스트 실행 이력</h2>
          {testRuns.length === 0 ? (
            <div className="bg-bg-2 border-line-2 rounded-4 border-2 border-dashed">
              <EmptyState
                icon={<PlayCircle className="h-8 w-8" />}
                title="테스트 실행 이력이 없습니다."
                description="마일스톤 기반 테스트 실행을 생성하세요."
              />
            </div>
          ) : (
            <div className="bg-bg-2 border-line-2 rounded-4 divide-line-2 divide-y border">
              {testRuns.map((run) => {
                const runStatusConfig = RUN_STATUS_CONFIG[run.status] || RUN_STATUS_CONFIG.NOT_STARTED;
                return (
                  <Link
                    key={run.id}
                    href={`/projects/${projectSlug}/runs/${run.id}`}
                    className="hover:bg-bg-3 flex items-center justify-between px-4 py-3 transition-colors"
                  >
                    <span className="text-text-1">{run.name}</span>
                    <div className="flex items-center gap-3">
                      <StatusBadge config={runStatusConfig} />
                      <span className="text-text-3 text-sm">{formatDateTime(run.updatedAt)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
        {isEditing && <MilestoneEditForm milestone={milestone} onClose={() => setIsEditing(false)} />}
        {isAddingCases && (
          <AddCasesToMilestoneModal
            milestoneId={milestoneId}
            milestoneName={milestone.title}
            availableCases={allCases.filter((tc) => !testCases.some((mtc) => mtc.id === tc.id))}
            onClose={() => setIsAddingCases(false)}
          />
        )}
        {isAddingSuites && (
          <AddSuitesToMilestoneModal
            milestoneId={milestoneId}
            milestoneName={milestone.title}
            availableSuites={allSuites.filter((suite) => !testSuites.some((mts) => mts.id === suite.id))}
            onClose={() => setIsAddingSuites(false)}
          />
        )}
        <AnimatePresence>
          {selectedTestCaseId && (
            <TestCaseSideView
              testCase={allCases.find((tc) => tc.id === selectedTestCaseId)}
              onClose={() => setSelectedTestCaseId(null)}
            />
          )}
        </AnimatePresence>
      </MainContainer>
  );
};
