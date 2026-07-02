'use client';

import React, { useState } from 'react';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { getTestCases } from '@/entities/test-case/api';
import { getTestSuites } from '@/entities/test-suite';
import { ArchiveButton } from '@/features/archive/ui/archive-button';
import { milestoneByIdQueryOptions } from '@/features/milestones';
import {
  AddCasesToMilestoneModal,
  AddSuitesToMilestoneModal,
  MilestoneEditForm,
} from '@/features/milestones-edit';
import { MILESTONE_EVENTS, track } from '@/shared/lib/analytics';
import { LastRunFreshnessLabel } from '@/shared/ui';
import { useQuery } from '@tanstack/react-query';
import {
  DSButton,
  EmptyState,
  MILESTONE_STATUS_CONFIG,
  MainContainer,
  RUN_STATUS_CONFIG,
  Skeleton,
  StatusBadge,
} from '@testea/ui';
import { formatDateTime } from '@testea/util';
import {
  ArrowLeft,
  Calendar,
  Edit2,
  FolderOpen,
  ListChecks,
  Play,
  PlayCircle,
  Plus,
  XCircle,
} from 'lucide-react';

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

export const MilestoneDetailView = () => {
  const params = useParams();
  const router = useRouter();
  const milestoneId = params.milestoneId as string;
  const projectSlug = params.slug as string;
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingCases, setIsAddingCases] = useState(false);
  const [isAddingSuites, setIsAddingSuites] = useState(false);
  const [selectedTestCaseId, setSelectedTestCaseId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery(milestoneByIdQueryOptions(milestoneId));

  React.useEffect(() => {
    if (data?.success) {
      track(MILESTONE_EVENTS.DETAIL_VIEW, { milestone_id: milestoneId });
    }
  }, [data?.success, milestoneId]);

  const { data: casesResult } = useQuery({
    queryKey: ['testCases', 'forMilestone', milestoneId],
    queryFn: () => getTestCases({ project_id: data?.success ? data.data.projectId : '' }),
    enabled: !!(data?.success && data.data.projectId),
  });

  const allCases = casesResult?.success ? (casesResult.data ?? []) : [];

  const { data: suitesResult } = useQuery({
    queryKey: ['testSuites', 'forMilestone', milestoneId],
    queryFn: () => getTestSuites({ projectId: data?.success ? data.data.projectId : '' }),
    enabled: !!(data?.success && data.data.projectId),
  });

  const allSuites = suitesResult?.success ? (suitesResult.data ?? []) : [];

  const handleRunTest = () => {
    router.push(`/projects/${projectSlug}/runs/create?milestoneId=${milestoneId}`);
  };

  if (isLoading) {
    return (
      <MainContainer className="grid min-h-screen w-full max-w-none flex-1 grid-cols-1 gap-6 px-5 py-5 lg:h-screen lg:grid-cols-[minmax(0,1fr)_340px] lg:grid-rows-[auto_minmax(0,1fr)] lg:overflow-hidden lg:px-8 lg:py-6">
        <header className="border-line-2 border-b pb-4 lg:col-span-2">
          <Skeleton className="h-8 w-80" />
          <Skeleton className="mt-3 h-4 w-96" />
        </header>
        <main className="min-h-[520px] py-5 lg:min-h-0">
          <Skeleton className="h-full min-h-[420px]" />
        </main>
        <aside className="border-line-2 border-t py-5 lg:border-t-0 lg:border-l lg:pl-6">
          <Skeleton className="h-80" />
        </aside>
      </MainContainer>
    );
  }

  if (isError || !data?.success) {
    return (
      <MainContainer className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <XCircle className="h-12 w-12 text-red-400" />
          <p className="text-text-1 font-semibold">마일스톤을 불러올 수 없습니다.</p>
          <Link
            href={`/projects/${projectSlug}/milestones`}
            className="text-primary hover:underline"
          >
            목록으로 돌아가기
          </Link>
        </div>
      </MainContainer>
    );
  }

  const milestone = data.data;
  const statusInfo = MILESTONE_STATUS_CONFIG[milestone.progressStatus] || {
    label: milestone.progressStatus,
    style: 'border border-line-2 text-text-3',
  };
  const testCases = milestone.testCases ?? [];
  const testSuites = milestone.testSuites ?? [];
  const testRuns = milestone.testRuns ?? [];

  return (
    <MainContainer className="grid min-h-screen w-full max-w-none flex-1 grid-cols-1 grid-rows-[auto_auto_auto] gap-x-7 px-5 py-5 lg:h-screen lg:grid-cols-[minmax(0,1fr)_340px] lg:grid-rows-[auto_minmax(0,1fr)] lg:overflow-hidden lg:px-8 lg:py-6">
      <header className="border-line-2 flex flex-col gap-4 border-b pb-4 lg:col-span-2 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            href={`/projects/${projectSlug}/milestones`}
            aria-label="마일스톤 목록으로"
            className="border-line-2 text-text-3 hover:bg-bg-2 hover:text-text-1 focus-visible:ring-primary inline-flex h-9 w-9 shrink-0 items-center justify-center border transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-3">
              <h1 className="text-text-1 truncate text-[22px] leading-7 font-semibold tracking-normal">
                {milestone.title}
              </h1>
              <StatusBadge config={statusInfo} className="shrink-0 px-2 py-0.5 text-xs" />
            </div>
            <div className="text-text-3 mt-1 flex min-w-0 items-center gap-4 text-xs">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" strokeWidth={1.7} aria-hidden="true" />
                {formatDateTime(milestone.startDate)} ~ {formatDateTime(milestone.endDate)}
              </span>
              <LastRunFreshnessLabel
                lastExecutedAt={milestone.lastExecutedAt}
                className="text-xs"
              />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <DSButton className="flex h-9 items-center gap-2 px-3" onClick={handleRunTest}>
            <Play className="h-4 w-4" aria-hidden="true" />
            실행 생성
          </DSButton>
          <DSButton
            variant="ghost"
            className="flex h-9 items-center gap-2 px-3"
            onClick={() => setIsEditing(true)}
          >
            <Edit2 className="h-4 w-4" aria-hidden="true" />
            수정
          </DSButton>
          <ArchiveButton
            targetType="milestone"
            targetId={milestoneId}
            onSuccess={() => router.push(`/projects/${projectSlug}/milestones`)}
          />
        </div>
      </header>

      <main className="min-h-[520px] overflow-hidden py-5 lg:min-h-0">
        <div className="flex h-full min-h-0 flex-col gap-6">
          <section className="flex min-h-0 flex-1 flex-col">
            <div className="border-line-2 flex shrink-0 items-center justify-between border-b pb-3">
              <div>
                <h2 className="text-text-1 text-base font-semibold">포함된 테스트 케이스</h2>
                <p className="text-text-3 mt-0.5 text-xs">마일스톤 범위에 포함된 케이스</p>
              </div>
              <DSButton
                variant="ghost"
                size="small"
                className="flex h-8 items-center gap-1 px-2"
                onClick={() => setIsAddingCases(true)}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                케이스 추가
              </DSButton>
            </div>

            {testCases.length === 0 ? (
              <div className="border-line-2 mt-4 border border-dashed">
                <EmptyState
                  icon={<ListChecks className="h-8 w-8" aria-hidden="true" />}
                  title="포함된 테스트 케이스가 없습니다."
                  description="테스트 케이스를 추가하여 마일스톤 범위를 정의하세요."
                  action={
                    <DSButton
                      variant="ghost"
                      className="flex h-8 items-center gap-1 px-2"
                      onClick={() => setIsAddingCases(true)}
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      테스트 케이스 추가
                    </DSButton>
                  }
                />
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto pt-4">
                <div className="border-line-2 text-text-3 bg-bg-2 grid grid-cols-[132px_minmax(0,1fr)] gap-4 border-x border-t px-3 py-2 text-[11px] font-medium tracking-wide uppercase">
                  <span>Case ID</span>
                  <span>Title</span>
                </div>
                <div className="border-line-2 divide-line-2 divide-y border">
                  {testCases.map((testCase) => (
                    <button
                      key={testCase.id}
                      type="button"
                      className="hover:bg-bg-2 grid w-full grid-cols-[132px_minmax(0,1fr)] items-center gap-4 px-3 py-2.5 text-left transition-colors"
                      onClick={() => setSelectedTestCaseId(testCase.id)}
                    >
                      <span className="text-primary truncate font-mono text-xs">
                        {testCase.caseKey}
                      </span>
                      <span className="text-text-1 truncate text-sm">{testCase.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="flex min-h-0 flex-1 flex-col">
            <div className="border-line-2 flex shrink-0 items-center justify-between border-b pb-3">
              <div>
                <h2 className="text-text-1 text-base font-semibold">포함된 테스트 스위트</h2>
                <p className="text-text-3 mt-0.5 text-xs">마일스톤 범위에 포함된 스위트</p>
              </div>
              <DSButton
                variant="ghost"
                size="small"
                className="flex h-8 items-center gap-1 px-2"
                onClick={() => setIsAddingSuites(true)}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                스위트 추가
              </DSButton>
            </div>

            {testSuites.length === 0 ? (
              <div className="border-line-2 mt-4 border border-dashed">
                <EmptyState
                  icon={<FolderOpen className="h-8 w-8" aria-hidden="true" />}
                  title="포함된 테스트 스위트가 없습니다."
                  description="테스트 스위트를 추가하여 마일스톤 범위를 정의하세요."
                  action={
                    <DSButton
                      variant="ghost"
                      className="flex h-8 items-center gap-1 px-2"
                      onClick={() => setIsAddingSuites(true)}
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      테스트 스위트 추가
                    </DSButton>
                  }
                />
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto pt-4">
                <div className="border-line-2 text-text-3 bg-bg-2 grid grid-cols-[minmax(0,1fr)_120px] gap-4 border-x border-t px-3 py-2 text-[11px] font-medium tracking-wide uppercase">
                  <span>Suite</span>
                  <span className="text-right">Cases</span>
                </div>
                <div className="border-line-2 divide-line-2 divide-y border">
                  {testSuites.map((suite) => {
                    const suiteCaseCount = testCases.filter(
                      (tc) =>
                        tc.id &&
                        allCases.some((ac) => ac.id === tc.id && ac.testSuiteId === suite.id)
                    ).length;
                    return (
                      <Link
                        key={suite.id}
                        href={`/projects/${projectSlug}/suites/${suite.id}`}
                        className="hover:bg-bg-2 grid grid-cols-[minmax(0,1fr)_120px] items-center gap-4 px-3 py-2.5 transition-colors"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <FolderOpen className="text-text-3 h-4 w-4 shrink-0" aria-hidden="true" />
                          <span className="text-text-1 truncate text-sm">{suite.title}</span>
                        </span>
                        <span className="text-text-3 text-right text-xs tabular-nums">
                          {suiteCaseCount}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <aside className="border-line-2 flex min-h-0 flex-col gap-6 border-t py-5 lg:overflow-y-auto lg:border-t-0 lg:border-l lg:pl-6">
        <section className="border-line-2 border-b pb-5">
          <h2 className="text-text-3 mb-2 text-xs font-semibold tracking-wide uppercase">
            Summary
          </h2>
          <p className="text-text-2 text-sm leading-6">
            {milestone.description || '설명이 없습니다.'}
          </p>
        </section>

        <section className="border-line-2 border-b pb-5">
          <h2 className="text-text-3 mb-3 text-xs font-semibold tracking-wide uppercase">
            Properties
          </h2>
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-text-3">테스트 케이스</dt>
              <dd className="text-text-1 tabular-nums">{milestone.totalCases}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-3">테스트 스위트</dt>
              <dd className="text-text-1 tabular-nums">{testSuites.length}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-3">테스트 실행</dt>
              <dd className="text-text-1 tabular-nums">{milestone.runCount}</dd>
            </div>
          </dl>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-text-3 text-xs font-semibold tracking-wide uppercase">
            Reference Runs
          </h2>
          {testRuns.length === 0 ? (
            <div className="border-line-2 border border-dashed py-6">
              <EmptyState
                icon={<PlayCircle className="h-6 w-6" aria-hidden="true" />}
                title="테스트 실행 이력이 없습니다."
                description="마일스톤 기반 테스트 실행을 생성하세요."
              />
            </div>
          ) : (
            <div className="border-line-2 divide-line-2 divide-y border">
              {testRuns.map((run) => {
                const runStatusConfig =
                  RUN_STATUS_CONFIG[run.status] || RUN_STATUS_CONFIG.NOT_STARTED;
                return (
                  <Link
                    key={run.id}
                    href={`/projects/${projectSlug}/runs/${run.id}`}
                    className="hover:bg-bg-2 block px-3 py-3 transition-colors"
                  >
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <span className="text-text-1 truncate text-sm">{run.name}</span>
                      <StatusBadge config={runStatusConfig} className="px-2 py-0.5 text-xs" />
                    </div>
                    <span className="text-text-3 text-xs">{formatDateTime(run.updatedAt)}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </aside>

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
          availableSuites={allSuites.filter(
            (suite) => !testSuites.some((mts) => mts.id === suite.id)
          )}
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
