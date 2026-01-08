'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

import { Container, DSButton, MainContainer, cn } from '@/shared';
import { Aside } from '@/widgets';
import { milestoneByIdQueryOptions } from '@/features/milestones';
import {
  ArrowLeft,
  Calendar,
  Edit2,
  ListChecks,
  Play,
  PlayCircle,
  Plus,
  Trash2,
  XCircle,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; style: string }> = {
  inProgress: {
    label: '진행 중',
    style: 'bg-amber-500/20 text-amber-300',
  },
  done: {
    label: '완료',
    style: 'bg-green-500/20 text-green-300',
  },
  planned: {
    label: '예정',
    style: 'bg-slate-500/20 text-slate-300',
  },
};

const TEST_STATUS_CONFIG: Record<string, { label: string; style: string }> = {
  pass: { label: 'Pass', style: 'bg-green-500/20 text-green-300' },
  fail: { label: 'Fail', style: 'bg-red-500/20 text-red-300' },
  blocked: { label: 'Blocked', style: 'bg-amber-500/20 text-amber-300' },
  untested: { label: 'Untested', style: 'bg-slate-500/20 text-slate-300' },
};

const RUN_STATUS_CONFIG: Record<string, { label: string; style: string }> = {
  NOT_STARTED: { label: 'Not Started', style: 'bg-slate-500/20 text-slate-300' },
  IN_PROGRESS: { label: 'In Progress', style: 'bg-blue-500/20 text-blue-300' },
  COMPLETED: { label: 'Completed', style: 'bg-green-500/20 text-green-300' },
};

const formatDate = (date: Date | null | undefined) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const MilestoneDetailView = () => {
  const params = useParams();
  const router = useRouter();
  const milestoneId = params.milestoneId as string;
  const projectSlug = params.slug as string;

  const { data, isLoading, isError } = useQuery(milestoneByIdQueryOptions(milestoneId));

  const handleRunTest = () => {
    router.push(`/projects/${projectSlug}/runs/create`);
  };

  if (isLoading) {
    return (
      <Container className="bg-bg-1 text-text-1 flex min-h-screen font-sans">
        <Aside />
        <MainContainer className="flex flex-1 items-center justify-center">
          <div className="text-text-3">로딩 중...</div>
        </MainContainer>
      </Container>
    );
  }

  if (isError || !data?.success) {
    return (
      <Container className="bg-bg-1 text-text-1 flex min-h-screen font-sans">
        <Aside />
        <MainContainer className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <XCircle className="h-12 w-12 text-red-400" />
            <p className="text-text-1 font-semibold">마일스톤을 불러올 수 없습니다.</p>
            <Link href={`/projects/${projectSlug}/milestones`} className="text-primary hover:underline">
              목록으로 돌아가기
            </Link>
          </div>
        </MainContainer>
      </Container>
    );
  }

  const milestone = data.data;
  const statusInfo = STATUS_CONFIG[milestone.status] || {
    label: milestone.status,
    style: 'bg-gray-500/20 text-gray-300',
  };

  return (
    <Container className="bg-bg-1 text-text-1 flex min-h-screen font-sans">
      <Aside />
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
                <h1 className="typo-title-heading">{milestone.name}</h1>
                <span className={cn('rounded-full px-3 py-1 text-sm font-medium', statusInfo.style)}>
                  {statusInfo.label}
                </span>
              </div>
              <div className="text-text-3 flex items-center gap-1.5 text-sm">
                <Calendar className="h-4 w-4" strokeWidth={1.5} />
                <span>
                  {formatDate(milestone.startDate)} ~ {formatDate(milestone.endDate)}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <DSButton variant="ghost" className="flex items-center gap-2">
                <Edit2 className="h-4 w-4" />
                수정
              </DSButton>
              <DSButton variant="ghost" className="flex items-center gap-2 text-red-400">
                <Trash2 className="h-4 w-4" />
                삭제
              </DSButton>
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
              <span className="text-primary text-2xl font-bold">{milestone.stats.progressRate}%</span>
            </div>
            <div className="bg-bg-3 h-3 w-full rounded-full">
              <div
                className="bg-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${milestone.stats.progressRate}%` }}
              />
            </div>
            <p className="text-text-3 mt-2 text-sm">
              {milestone.stats.completedCases} / {milestone.stats.totalCases} 케이스 완료
            </p>
          </div>

          {/* 통계 카드들 */}
          <div className="bg-bg-2 border-line-2 rounded-4 flex flex-col gap-1 border p-4">
            <div className="text-text-3 flex items-center gap-1.5 text-sm">
              <ListChecks className="h-4 w-4" strokeWidth={1.5} />
              <span>테스트 케이스</span>
            </div>
            <span className="text-text-1 text-2xl font-bold">{milestone.stats.totalCases}개</span>
          </div>

          <div className="bg-bg-2 border-line-2 rounded-4 flex flex-col gap-1 border p-4">
            <div className="text-text-3 flex items-center gap-1.5 text-sm">
              <PlayCircle className="h-4 w-4" strokeWidth={1.5} />
              <span>테스트 실행</span>
            </div>
            <span className="text-text-1 text-2xl font-bold">{milestone.stats.runCount}회</span>
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
            <DSButton variant="ghost" size="small" className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              케이스 추가
            </DSButton>
          </div>

          {milestone.testCases.length === 0 ? (
            <div className="bg-bg-2 border-line-2 rounded-4 flex flex-col items-center justify-center gap-4 border-2 border-dashed py-12">
              <ListChecks className="text-text-3 h-8 w-8" />
              <div className="text-center">
                <p className="text-text-1 font-semibold">포함된 테스트 케이스가 없습니다.</p>
                <p className="text-text-3 text-sm">테스트 케이스를 추가하여 마일스톤 범위를 정의하세요.</p>
              </div>
              <DSButton variant="ghost" className="flex items-center gap-1">
                <Plus className="h-4 w-4" />
                테스트 케이스 추가
              </DSButton>
            </div>
          ) : (
            <div className="bg-bg-2 border-line-2 rounded-4 divide-line-2 divide-y border">
              {milestone.testCases.map((testCase) => {
                const statusConfig = TEST_STATUS_CONFIG[testCase.lastStatus || 'untested'] || TEST_STATUS_CONFIG.untested;
                return (
                  <div
                    key={testCase.id}
                    className="hover:bg-bg-3 flex items-center justify-between px-4 py-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-primary font-mono text-sm">{testCase.code}</span>
                      <span className="text-text-1">{testCase.title}</span>
                    </div>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        statusConfig.style
                      )}
                    >
                      {statusConfig.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 테스트 실행 이력 */}
        <section className="col-span-6 flex flex-col gap-4">
          <h2 className="typo-h2-heading">테스트 실행 이력</h2>
          {milestone.testRuns.length === 0 ? (
            <div className="bg-bg-2 border-line-2 rounded-4 flex flex-col items-center justify-center gap-4 border-2 border-dashed py-12">
              <PlayCircle className="text-text-3 h-8 w-8" />
              <div className="text-center">
                <p className="text-text-1 font-semibold">테스트 실행 이력이 없습니다.</p>
                <p className="text-text-3 text-sm">마일스톤 기반 테스트 실행을 생성하세요.</p>
              </div>
            </div>
          ) : (
            <div className="bg-bg-2 border-line-2 rounded-4 divide-line-2 divide-y border">
              {milestone.testRuns.map((run) => {
                const runStatusConfig = RUN_STATUS_CONFIG[run.status] || RUN_STATUS_CONFIG.NOT_STARTED;
                return (
                  <Link
                    key={run.id}
                    href={`/projects/${projectSlug}/runs/${run.id}`}
                    className="hover:bg-bg-3 flex items-center justify-between px-4 py-3 transition-colors"
                  >
                    <span className="text-text-1">{run.name}</span>
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          runStatusConfig.style
                        )}
                      >
                        {runStatusConfig.label}
                      </span>
                      <span className="text-text-3 text-sm">{formatDate(run.updatedAt)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </MainContainer>
    </Container>
  );
};
