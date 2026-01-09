'use client';
import React, { useState } from 'react';
import { Container, MainContainer } from '@/shared';
import { Aside } from '@/widgets';
import {
  Search,
  Filter,
  ChevronDown,
  PlayCircle,
  Clock,
  CheckCircle2,
  ListTodo
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { dashboardQueryOptions } from '@/features/dashboard';
import { testRunsQueryOptions } from '@/features/runs';

type RunStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
type RunSourceType = 'SUITE' | 'MILESTONE' | 'ADHOC';

interface ITestRun {
  id: string;
  name: string;
  sourceType: RunSourceType;
  sourceName: string;
  status: RunStatus;
  updatedAt: Date;
}

export const TestRunsListView = () => {
  const params = useParams();
  const router = useRouter();
  const projectSlug = params.slug as string;
  const [sortOption, setSortOption] = useState<'UPDATED' | 'NAME'>('UPDATED');

  const { data: dashboardData, isLoading: isLoadingProject } = useQuery(
    dashboardQueryOptions.stats(projectSlug)
  );

  const projectId = dashboardData?.success ? dashboardData.data.project.id : undefined;

  const { data: fetchedRunsData, isLoading: isLoadingRuns } = useQuery({
    ...testRunsQueryOptions(projectId!),
    enabled: !!projectId,
  });

  const testRuns: ITestRun[] = (fetchedRunsData?.success ? fetchedRunsData.data : []) as ITestRun[];

  const sortedRuns = [...testRuns].sort((a, b) => {
    if (sortOption === 'NAME') return a.name.localeCompare(b.name);
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const getStatusBadgeStyle = (status: RunStatus) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-primary/10 text-primary';
      case 'IN_PROGRESS':
        return 'bg-system-blue/10 text-system-blue';
      case 'NOT_STARTED':
      default:
        return 'bg-bg-4 text-text-3';
    }
  };

  const getStatusLabel = (status: RunStatus) => {
    switch (status) {
      case 'COMPLETED': return 'Completed';
      case 'IN_PROGRESS': return 'In Progress';
      case 'NOT_STARTED': return 'Not Started';
    }
  };

  const getSourceIcon = (type: RunSourceType) => {
    switch(type) {
      case 'SUITE': return <ListTodo className="h-3.5 w-3.5" />;
      case 'MILESTONE': return <Clock className="h-3.5 w-3.5" />;
      default: return <PlayCircle className="h-3.5 w-3.5" />;
    }
  };

  if (isLoadingProject || (projectId && isLoadingRuns)) {
    return (
      <Container className="bg-bg-1 text-text-1 flex min-h-screen items-center justify-center font-sans">
        <Aside />
        <MainContainer className="flex-1 flex items-center justify-center">
          <div>Loading runs...</div>
        </MainContainer>
      </Container>
    );
  }

  return (
    <Container className="bg-bg-1 text-text-1 flex min-h-screen items-center justify-center font-sans">
      <Aside />

      <MainContainer className="grid min-h-screen w-full flex-1 grid-cols-6 content-start gap-x-5 gap-y-8 py-8 max-w-[1200px] mx-auto px-10">
        <header className="col-span-6 flex flex-col gap-1 border-b border-line-2 pb-6">
          <h2 className="typo-h1-heading text-text-1">테스트 실행 목록</h2>
          <p className="typo-body2-normal text-text-2">
            프로젝트의 모든 테스트 실행(Test Run) 진행 상황을 확인하고 관리합니다.
          </p>
        </header>

        <section className="col-span-6 flex items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative w-full max-w-md">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-3">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                placeholder="실행 이름 검색..."
                className="typo-body2-normal w-full rounded-2 border border-line-2 bg-bg-2 py-2 pl-10 pr-4 text-text-1 placeholder:text-text-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="relative">
            <button className="typo-body2-heading flex items-center gap-2 rounded-2 border border-line-2 bg-bg-2 px-3 py-2 text-text-2 hover:bg-bg-3 transition-colors">
              <Filter className="h-4 w-4" />
              <span>정렬: {sortOption === 'UPDATED' ? '최근 수정 순' : '이름 순'}</span>
              <ChevronDown className="h-4 w-4 text-text-3" />
            </button>
          </div>
        </section>

        <section className="col-span-6 flex flex-col overflow-hidden rounded-4 border border-line-2 bg-bg-2 shadow-1">
          <div className="grid grid-cols-12 gap-4 border-b border-line-2 bg-bg-3 px-6 py-3">
            <div className="col-span-5 typo-caption-heading text-text-3 uppercase">실행 이름 / 기준</div>
            <div className="col-span-3 typo-caption-heading text-text-3 uppercase">진행률 (완료/전체)</div>
            <div className="col-span-2 text-center typo-caption-heading text-text-3 uppercase">상태</div>
            <div className="col-span-2 text-right typo-caption-heading text-text-3 uppercase">마지막 업데이트</div>
          </div>

          {sortedRuns.map((run) => {
            const totalCases = 0;
            const completedCases = 0;
            const progressPercent = Math.round((completedCases / totalCases) * 100) || 0;

            return (
              <div
                key={run.id}
                onClick={() => router.push(`/projects/${projectSlug}/runs/${run.id}`)}
                className="group grid cursor-pointer grid-cols-12 items-center gap-4 border-b border-line-2 px-6 py-5 transition-colors hover:bg-bg-3 last:border-b-0"
              >
                <div className="col-span-5 flex flex-col gap-1.5">
                  <span className="typo-body1-heading text-text-1 group-hover:text-primary transition-colors">
                    {run.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-1 bg-bg-4 px-1.5 py-0.5 text-[11px] font-medium text-text-2">
                      {getSourceIcon(run.sourceType)}
                      {run.sourceType}
                    </span>
                    <span className="typo-caption-normal text-text-3">
                      {run.sourceName}
                    </span>
                  </div>
                </div>

                <div className="col-span-3 flex flex-col gap-2 pr-4">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-text-1">{progressPercent}%</span>
                    <span className="text-text-3">{completedCases} / {totalCases}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-bg-4">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        run.status === 'COMPLETED' ? 'bg-primary' : 'bg-system-blue'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="col-span-2 flex justify-center">
                  <span className={`typo-caption-heading inline-flex items-center rounded-1 px-2.5 py-1 ${getStatusBadgeStyle(run.status)}`}>
                    {run.status === 'COMPLETED' && <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
                    {run.status === 'IN_PROGRESS' && <PlayCircle className="mr-1.5 h-3.5 w-3.5" />}
                    {getStatusLabel(run.status)}
                  </span>
                </div>

                <div className="col-span-2 text-right">
                  <span className="typo-caption-normal text-text-3">
                    {new Date(run.updatedAt).toLocaleDateString()}
                  </span>
                  <div className="typo-caption-normal text-text-4">
                    {new Date(run.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}

          {testRuns.length === 0 && (
            <div className="flex h-60 flex-col items-center justify-center gap-2 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-3 text-text-3">
                <ListTodo className="h-6 w-6" />
              </div>
              <p className="typo-body1-heading text-text-2">생성된 테스트 실행이 없습니다.</p>
              <p className="typo-caption-normal text-text-3">새로운 테스트 실행을 생성하여 결과를 기록해보세요.</p>
            </div>
          )}
        </section>
      </MainContainer>
    </Container>
  );
};