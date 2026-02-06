'use client';

import React, { useState } from 'react';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

import { testSuiteByIdQueryOptions } from '@/entities/test-suite/api/query';
import { getTestCases } from '@/entities/test-case/api/server-actions';
import type { TestSuiteCard } from '@/entities/test-suite';
import type { TestCase, TestCaseCardType } from '@/entities/test-case';
import { SuiteEditForm, AddCasesToSuiteModal } from '@/features';
import { Container, DSButton, MainContainer, cn, LoadingSpinner } from '@/shared';
import { Aside } from '@/widgets';
import {
  ArrowLeft,
  Calendar,
  Edit2,
  FolderTree,
  ListChecks,
  Play,
  PlayCircle,
  Plus,
  Tag,
  Trash2,
} from 'lucide-react';
import { ArchiveButton } from '@/features/archive/ui/archive-button';

const TAG_TONE_CONFIG: Record<string, { style: string }> = {
  neutral: { style: 'bg-slate-500/20 text-slate-300' },
  info: { style: 'bg-blue-500/20 text-blue-300' },
  success: { style: 'bg-green-500/20 text-green-300' },
  warning: { style: 'bg-amber-500/20 text-amber-300' },
  danger: { style: 'bg-red-500/20 text-red-300' },
};

const RUN_STATUS_CONFIG: Record<string, { label: string; style: string }> = {
  passed: { label: 'Passed', style: 'bg-green-500/20 text-green-300' },
  failed: { label: 'Failed', style: 'bg-red-500/20 text-red-300' },
  blocked: { label: 'Blocked', style: 'bg-amber-500/20 text-amber-300' },
  running: { label: 'Running', style: 'bg-blue-500/20 text-blue-300' },
  not_run: { label: 'Not Run', style: 'bg-slate-500/20 text-slate-300' },
};

const TEST_STATUS_CONFIG: Record<string, { label: string; style: string }> = {
  passed: { label: 'Passed', style: 'bg-green-500/20 text-green-300' },
  failed: { label: 'Failed', style: 'bg-red-500/20 text-red-300' },
  blocked: { label: 'Blocked', style: 'bg-amber-500/20 text-amber-300' },
  untested: { label: 'Untested', style: 'bg-slate-500/20 text-slate-300' },
};

const formatDate = (date: Date | null | undefined) => {
  if (!date) return '-';
  return date.toISOString().split('T')[0];
};

const formatDateTime = (date: Date | null | undefined) => {
  if (!date) return '-';
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const TestSuiteDetailView = () => {
  const params = useParams();
  const router = useRouter();
  const suiteId = params.suiteId as string;
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingCases, setIsAddingCases] = useState(false);

  const handleRunTest = () => {
    router.push(`/projects/${params.slug}/runs/create`);
  };

  // 실제 API로 스위트 데이터 조회
  const { data: suiteResult, isLoading: isSuiteLoading } = useQuery(testSuiteByIdQueryOptions(suiteId));

  // 해당 프로젝트의 테스트 케이스 조회
  const { data: casesResult, isLoading: isCasesLoading } = useQuery({
    queryKey: ['testCases', 'bySuite', suiteId],
    queryFn: () => getTestCases({ project_id: suiteResult?.success ? suiteResult.data?.projectId ?? '' : '' }),
    enabled: !!(suiteResult?.success && suiteResult.data?.projectId),
  });

  // 로딩 중
  if (isSuiteLoading) {
    return (
      <Container className="bg-bg-1 text-text-1 flex min-h-screen font-sans">
        <Aside />
        <MainContainer className="flex flex-1 items-center justify-center">
          <LoadingSpinner size="lg" />
        </MainContainer>
      </Container>
    );
  }

  // 실제 데이터를 TestSuiteCard 형태로 변환 (추가 필드는 기본값)
  const rawSuite = suiteResult?.success ? suiteResult.data : undefined;
  const suite: TestSuiteCard | undefined = rawSuite
    ? {
        ...rawSuite,
        tag: { label: '기본', tone: 'neutral' as const },
        includedPaths: [],
        caseCount: 0,
        executionHistoryCount: 0,
        recentRuns: [],
      }
    : undefined;

  // 해당 스위트에 속한 테스트 케이스 필터링
  const allCases = casesResult?.success ? casesResult.data ?? [] : [];
  const testCases: TestCaseCardType[] = allCases
    .filter((tc: TestCase) => tc.testSuiteId === suite?.id)
    .map((tc: TestCase) => ({
      ...tc,
      suiteTitle: suite?.title ?? '',
      status: tc.resultStatus === 'untested' ? 'untested' : tc.resultStatus === 'pass' ? 'passed' : tc.resultStatus === 'fail' ? 'failed' : 'blocked',
      lastExecutedAt: null,
    }));

  // 케이스 수 업데이트
  if (suite) {
    suite.caseCount = testCases.length;
  }

  if (!suite) {
    return (
      <Container className="bg-bg-1 text-text-1 flex min-h-screen font-sans">
        <Aside />
        <MainContainer className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-text-1 font-semibold">테스트 스위트를 찾을 수 없습니다.</p>
            <Link
              href={`/projects/${params.slug}/suites`}
              className="text-primary mt-4 inline-block hover:underline"
            >
              스위트 목록으로 돌아가기
            </Link>
          </div>
        </MainContainer>
      </Container>
    );
  }

  const tagToneStyle = TAG_TONE_CONFIG[suite.tag?.tone ?? 'neutral']?.style ?? TAG_TONE_CONFIG.neutral.style;

  // 통계 계산
  const passedCount = suite.lastRun?.counts.passed ?? 0;
  const failedCount = suite.lastRun?.counts.failed ?? 0;
  const blockedCount = suite.lastRun?.counts.blocked ?? 0;
  const totalCount = suite.lastRun?.total ?? suite.caseCount;
  const passRate = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;

  return (
    <Container className="bg-bg-1 text-text-1 flex min-h-screen font-sans">
      <Aside />
      <MainContainer className="mx-auto grid min-h-screen w-full max-w-[1200px] flex-1 grid-cols-6 content-start gap-x-5 gap-y-6 px-10 py-8">
        {/* 뒤로가기 + 헤더 */}
        <header className="col-span-6 flex flex-col gap-4">
          <Link
            href={`/projects/${params.slug}/suites`}
            className="text-text-3 hover:text-text-1 flex w-fit items-center gap-1 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            스위트 목록으로
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <h1 className="typo-title-heading">{suite.title}</h1>
                {suite.tag && (
                  <span className={cn('rounded-full px-3 py-1 text-sm font-medium', tagToneStyle)}>
                    {suite.tag.label}
                  </span>
                )}
              </div>
              <div className="text-text-3 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" strokeWidth={1.5} />
                  <span>생성일: {formatDate(suite.createdAt)}</span>
                </div>
                {suite.linkedMilestone && (
                  <div className="flex items-center gap-1.5">
                    <Tag className="h-4 w-4" strokeWidth={1.5} />
                    <span>
                      {suite.linkedMilestone.title} ({suite.linkedMilestone.versionLabel})
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <DSButton variant="ghost" className="flex items-center gap-2" onClick={() => setIsEditing(true)}>
                <Edit2 className="h-4 w-4" />
                수정
              </DSButton>
              <ArchiveButton targetType='suite' targetId={suite.id} onSuccess={() => router.push(`/projects/${params.slug}/suites`)}/>
            </div>
          </div>
        </header>

        {/* 설명 */}
        <section className="col-span-6">
          <div className="bg-bg-2 border-line-2 rounded-4 border p-4">
            <p className="text-text-2">{suite.description || '설명이 없습니다.'}</p>
          </div>
        </section>

        {/* 포함 경로 */}
        {suite.includedPaths && suite.includedPaths.length > 0 && (
          <section className="col-span-6">
            <div className="bg-bg-2 border-line-2 rounded-4 border p-4">
              <div className="mb-3 flex items-center gap-2">
                <FolderTree className="text-text-3 h-4 w-4" strokeWidth={1.5} />
                <h3 className="text-text-3 font-semibold">포함된 경로</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {suite.includedPaths.map((path, index) => (
                  <code
                    key={index}
                    className="bg-bg-3 text-primary rounded px-2 py-1 font-mono text-sm"
                  >
                    {path}
                  </code>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 통계 카드 */}
        <section className="col-span-6 grid grid-cols-4 gap-4">
          {/* 테스트 케이스 수 */}
          <div className="bg-bg-2 border-line-2 rounded-4 flex flex-col gap-1 border p-4">
            <div className="text-text-3 flex items-center gap-1.5 text-sm">
              <ListChecks className="h-4 w-4" strokeWidth={1.5} />
              <span>테스트 케이스</span>
            </div>
            <span className="text-text-1 text-2xl font-bold">{suite.caseCount}개</span>
          </div>

          {/* 테스트 실행 횟수 */}
          <div className="bg-bg-2 border-line-2 rounded-4 flex flex-col gap-1 border p-4">
            <div className="text-text-3 flex items-center gap-1.5 text-sm">
              <PlayCircle className="h-4 w-4" strokeWidth={1.5} />
              <span>실행 이력</span>
            </div>
            <span className="text-text-1 text-2xl font-bold">{suite.executionHistoryCount}회</span>
          </div>

          {/* 통과율 */}
          <div className="bg-bg-2 border-line-2 rounded-4 col-span-2 border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-text-3 font-semibold">마지막 실행 통과율</h3>
              <span className="text-primary text-2xl font-bold">{passRate}%</span>
            </div>
            <div className="bg-bg-3 h-3 w-full rounded-full">
              <div
                className="bg-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${passRate}%` }}
              />
            </div>
            <p className="text-text-3 mt-2 text-sm">
              {passedCount} / {totalCount} 케이스 통과
            </p>
          </div>
        </section>

        {/* 마지막 실행 요약 */}
        {suite.lastRun && (
          <section className="col-span-6">
            <div className="bg-bg-2 border-line-2 rounded-4 border p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-text-1 font-semibold">마지막 실행</h3>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-medium',
                    RUN_STATUS_CONFIG[suite.lastRun.status]?.style ?? RUN_STATUS_CONFIG.not_run.style
                  )}
                >
                  {RUN_STATUS_CONFIG[suite.lastRun.status]?.label ?? suite.lastRun.status}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-4 text-center">
                <div>
                  <p className="text-text-3 text-sm">실행 일시</p>
                  <p className="text-text-1 font-medium">{formatDateTime(suite.lastRun.runAt)}</p>
                </div>
                <div>
                  <p className="text-text-3 text-sm">Passed</p>
                  <p className="font-medium text-green-400">{suite.lastRun.counts.passed}</p>
                </div>
                <div>
                  <p className="text-text-3 text-sm">Failed</p>
                  <p className="font-medium text-red-400">{suite.lastRun.counts.failed}</p>
                </div>
                <div>
                  <p className="text-text-3 text-sm">Blocked</p>
                  <p className="font-medium text-amber-400">{suite.lastRun.counts.blocked}</p>
                </div>
                <div>
                  <p className="text-text-3 text-sm">Skipped</p>
                  <p className="text-text-2 font-medium">{suite.lastRun.counts.skipped}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 테스트 실행 생성 버튼 */}
        <section className="col-span-6">
          <DSButton className="flex items-center gap-2" onClick={handleRunTest}>
            <Play className="h-4 w-4" />
            스위트 기반 테스트 실행 생성
          </DSButton>
        </section>

        {/* 테스트 케이스 목록 */}
        <section className="col-span-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="typo-h2-heading">포함된 테스트 케이스</h2>
            <DSButton variant="ghost" size="small" className="flex items-center gap-1" onClick={() => setIsAddingCases(true)}>
              <Plus className="h-4 w-4" />
              케이스 추가
            </DSButton>
          </div>

          {testCases.length === 0 ? (
            <div className="bg-bg-2 border-line-2 rounded-4 flex flex-col items-center justify-center gap-4 border-2 border-dashed py-12">
              <ListChecks className="text-text-3 h-8 w-8" />
              <div className="text-center">
                <p className="text-text-1 font-semibold">포함된 테스트 케이스가 없습니다.</p>
                <p className="text-text-3 text-sm">테스트 케이스를 추가하여 스위트 범위를 정의하세요.</p>
              </div>
              <DSButton variant="ghost" className="flex items-center gap-1" onClick={() => setIsAddingCases(true)}>
                <Plus className="h-4 w-4" />
                테스트 케이스 추가
              </DSButton>
            </div>
          ) : (
            <div className="bg-bg-2 border-line-2 rounded-4 divide-line-2 divide-y border">
              {testCases.map((testCase: TestCaseCardType) => {
                const statusConfig = TEST_STATUS_CONFIG[testCase.status] ?? TEST_STATUS_CONFIG.untested;
                return (
                  <div
                    key={testCase.id}
                    className="hover:bg-bg-3 flex items-center justify-between px-4 py-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-primary font-mono text-sm">{testCase.caseKey}</span>
                      <span className="text-text-1">{testCase.title}</span>
                      <div className="flex gap-1">
                        {testCase.tags.slice(0, 2).map((tag: string) => (
                          <span
                            key={tag}
                            className="bg-bg-3 text-text-3 rounded px-1.5 py-0.5 text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {testCase.lastExecutedAt && (
                        <span className="text-text-3 text-xs">
                          {formatDateTime(testCase.lastExecutedAt)}
                        </span>
                      )}
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          statusConfig.style
                        )}
                      >
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 최근 실행 이력 */}
        <section className="col-span-6 flex flex-col gap-4">
          <h2 className="typo-h2-heading">최근 실행 이력</h2>

          {suite.recentRuns.length === 0 ? (
            <div className="bg-bg-2 border-line-2 rounded-4 flex flex-col items-center justify-center gap-4 border-2 border-dashed py-12">
              <PlayCircle className="text-text-3 h-8 w-8" />
              <div className="text-center">
                <p className="text-text-1 font-semibold">테스트 실행 이력이 없습니다.</p>
                <p className="text-text-3 text-sm">스위트 기반 테스트 실행을 생성하세요.</p>
              </div>
            </div>
          ) : (
            <div className="bg-bg-2 border-line-2 rounded-4 divide-line-2 divide-y border">
              {suite.recentRuns.map((run) => {
                const runStatusConfig = RUN_STATUS_CONFIG[run.status] ?? RUN_STATUS_CONFIG.not_run;
                const runPassRate = run.total > 0 ? Math.round((run.passed / run.total) * 100) : 0;
                return (
                  <div
                    key={run.runId}
                    className="hover:bg-bg-3 flex items-center justify-between px-4 py-3 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          runStatusConfig.style
                        )}
                      >
                        {runStatusConfig.label}
                      </span>
                      <span className="text-text-2">{formatDateTime(run.runAt)}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-green-400">{run.passed} passed</span>
                        <span className="text-red-400">{run.failed} failed</span>
                        <span className="text-amber-400">{run.blocked} blocked</span>
                      </div>
                      <div className="w-20">
                        <div className="bg-bg-3 h-2 w-full rounded-full">
                          <div
                            className="bg-primary h-full rounded-full"
                            style={{ width: `${runPassRate}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-text-3 w-12 text-right text-sm">{runPassRate}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
        {isEditing && suite && <SuiteEditForm suite={suite} onClose={() => setIsEditing(false)} />}
        {isAddingCases && suite && (
          <AddCasesToSuiteModal
            suiteId={suite.id}
            suiteName={suite.title}
            availableCases={allCases.filter((tc: TestCase) => tc.testSuiteId !== suite.id)}
            onClose={() => setIsAddingCases(false)}
          />
        )}
      </MainContainer>
    </Container>
  );
};

export default TestSuiteDetailView;
