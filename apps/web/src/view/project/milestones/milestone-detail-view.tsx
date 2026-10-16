'use client';

import React, { useEffect, useState } from 'react';

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
import { todayDateOnly } from '@/shared/lib/date-only';
import { useQuery } from '@tanstack/react-query';
import { MainContainer, Skeleton } from '@testea/ui';
import { cn } from '@testea/util';
import { ChevronLeft, Play, XCircle } from 'lucide-react';

import {
  buildProgressSeries,
  progressBySuite,
  summarizeRisks,
} from './_components/milestone-detail-model';
import {
  type CaseFilter,
  CasesTab,
  MilestoneAside,
  RunsTab,
  SuitesTab,
} from './_components/milestone-detail-panels';
import { dueHintOf, formatMonthDay, milestoneHealthOf } from './_components/milestone-list-model';
import { MILESTONE_HEALTH, ProgressRing } from './_components/milestone-list-row';
import { MilestoneProgressChart } from './_components/milestone-progress-chart';

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

type DetailTab = 'runs' | 'suites' | 'cases';

export const MilestoneDetailView = () => {
  const params = useParams();
  const router = useRouter();
  const milestoneId = params.milestoneId as string;
  const projectSlug = params.slug as string;
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingCases, setIsAddingCases] = useState(false);
  const [isAddingSuites, setIsAddingSuites] = useState(false);
  const [selectedTestCaseId, setSelectedTestCaseId] = useState<string | null>(null);
  const [tab, setTab] = useState<DetailTab>('runs');
  const [caseFilter, setCaseFilter] = useState<CaseFilter>('all');

  // 상태·남은 날·그래프는 오늘 날짜에 달려 있어 서버와 어긋나지 않게 마운트 뒤에 그린다
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 마운트 후 로컬 날짜를 1회 확정. SSR↔CSR 미스매치 방지용
    setToday(todayDateOnly());
  }, []);

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

  if (isLoading || !today) {
    return (
      <MainContainer className="flex min-h-screen w-full flex-1 flex-col gap-4 px-4 py-5 md:px-8">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-80" />
        <Skeleton className="h-4 w-[480px] max-w-full" />
        <Skeleton className="h-[200px] w-full" />
        <div className="flex gap-6">
          <Skeleton className="h-[320px] flex-1" />
          <Skeleton className="hidden h-[320px] w-[300px] lg:block" />
        </div>
      </MainContainer>
    );
  }

  if (isError || !data?.success) {
    return (
      <MainContainer className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <XCircle className="text-result-fail h-12 w-12" />
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
  const testCases = milestone.testCases ?? [];
  const testSuites = milestone.testSuites ?? [];
  const testRuns = milestone.testRuns ?? [];

  const health = milestoneHealthOf(milestone, today);
  const healthInfo = MILESTONE_HEALTH[health];
  const due = dueHintOf(milestone, today);
  const series = buildProgressSeries(milestone, testCases, today);
  const risks = summarizeRisks(milestone, testCases, today);
  const suiteRows = progressBySuite(testSuites, testCases);

  const tabs: { value: DetailTab; label: string; count: number }[] = [
    { value: 'runs', label: '실행', count: testRuns.length },
    { value: 'suites', label: '스위트', count: testSuites.length },
    { value: 'cases', label: '케이스', count: testCases.length },
  ];

  return (
    <MainContainer className="flex min-h-screen w-full flex-1 flex-col lg:h-screen lg:overflow-hidden">
      <div className="border-line-2 flex shrink-0 flex-col gap-4 border-b px-4 pt-5 pb-5 md:px-8">
        <header className="flex flex-col gap-2">
          <nav
            aria-label="breadcrumb"
            className="flex items-center gap-1.5 text-[12px] text-white/40"
          >
            <Link
              href={`/projects/${projectSlug}/milestones`}
              className="inline-flex items-center gap-0.5 hover:text-white/70"
            >
              <ChevronLeft className="h-3 w-3" aria-hidden="true" />
              마일스톤
            </Link>
            <span aria-hidden="true">/</span>
            <span className="truncate text-white/60">{milestone.title}</span>
          </nav>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-2">
              <div className="flex min-w-0 items-center gap-2.5">
                <ProgressRing percent={milestone.progressRate} health={health} />
                <h1 className="truncate text-[22px] font-bold tracking-[-0.02em] text-white">
                  {milestone.title}
                </h1>
              </div>
              <dl className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12px]">
                <div className="flex items-center gap-2">
                  <dt className="text-white/40">상태</dt>
                  <dd>
                    <span
                      className={cn(
                        'flex items-center gap-[5px] rounded-[9px] border py-0.5 pr-2 pl-[7px] text-[11px] font-medium',
                        healthInfo.tone,
                        healthInfo.border
                      )}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                      {healthInfo.label}
                    </span>
                  </dd>
                </div>
                <div className="flex items-center gap-2">
                  <dt className="text-white/40">기간</dt>
                  <dd className="font-mono text-white/85">
                    {milestone.startDate ? formatMonthDay(milestone.startDate) : '-'} →{' '}
                    {milestone.endDate ? formatMonthDay(milestone.endDate) : '-'}
                    {due && (
                      <span
                        className={cn(
                          'ml-1.5 font-sans',
                          due.tone === 'danger' ? 'text-result-fail' : 'text-result-blocked'
                        )}
                      >
                        {due.text}
                      </span>
                    )}
                  </dd>
                </div>
                <div className="flex items-center gap-2">
                  <dt className="text-white/40">범위</dt>
                  <dd className="text-white/85">
                    스위트 {milestone.suiteCount} · 케이스 {milestone.totalCases}
                  </dd>
                </div>
              </dl>
              <p className="text-[13px] text-white/55">
                {milestone.description || '설명이 없습니다.'}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="border-line-2 h-9 rounded-[6px] border px-3.5 text-[13px] text-white/85 hover:bg-white/[0.04]"
              >
                수정
              </button>
              <ArchiveButton
                targetType="milestone"
                targetId={milestoneId}
                btnType="icon"
                onSuccess={() => router.push(`/projects/${projectSlug}/milestones`)}
              />
              <Link
                href={`/projects/${projectSlug}/runs/create?milestoneId=${milestoneId}`}
                className="bg-primary hover:bg-primary/90 inline-flex h-9 items-center gap-1.5 rounded-[6px] px-3.5 text-[13px] font-medium text-white"
              >
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
                실행 생성
              </Link>
            </div>
          </div>
        </header>

        <MilestoneProgressChart milestone={milestone} series={series} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="min-w-0 flex-1 px-4 pb-6 md:px-8 lg:overflow-y-auto">
          <div
            role="tablist"
            aria-label="마일스톤 내용"
            className="border-line-2 bg-bg-1 sticky top-0 z-10 flex gap-1 border-b pt-3"
          >
            {tabs.map((item) => {
              const active = tab === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(item.value)}
                  className={cn(
                    '-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-[14px]',
                    active
                      ? 'border-primary font-bold text-white'
                      : 'border-transparent font-medium text-white/40 hover:text-white/70'
                  )}
                >
                  {item.label}
                  <span className="font-mono text-[11px] font-normal text-white/35">
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>

          {tab === 'runs' && (
            <RunsTab runs={testRuns} projectSlug={projectSlug} milestoneId={milestoneId} />
          )}
          {tab === 'suites' && (
            <SuitesTab
              rows={suiteRows}
              projectSlug={projectSlug}
              onAddSuites={() => setIsAddingSuites(true)}
            />
          )}
          {tab === 'cases' && (
            <CasesTab
              cases={testCases}
              filter={caseFilter}
              onFilterChange={setCaseFilter}
              onSelectCase={setSelectedTestCaseId}
              onAddCases={() => setIsAddingCases(true)}
            />
          )}
        </div>

        <div className="border-line-2 shrink-0 border-t px-4 py-5 md:px-8 lg:w-[320px] lg:overflow-y-auto lg:border-t-0 lg:border-l lg:px-5">
          <MilestoneAside
            suiteRows={suiteRows}
            risks={risks}
            onShowCases={(filter) => {
              setCaseFilter(filter);
              setTab('cases');
            }}
          />
        </div>
      </div>

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
