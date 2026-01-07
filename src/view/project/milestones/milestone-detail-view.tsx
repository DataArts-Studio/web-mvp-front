'use client';
import React from 'react';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { MilestoneWithStats } from '@/entities/milestone';
import { Container, DSButton, MainContainer, cn } from '@/shared';
import { Aside } from '@/widgets';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Edit2,
  ListChecks,
  Play,
  PlayCircle,
  Plus,
  Trash2,
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

const formatDate = (date: Date | null) => {
  if (!date) return '-';
  return date.toISOString().split('T')[0];
};

// Mock data - 실제로는 API에서 가져옴
const MOCK_MILESTONE: MilestoneWithStats = {
  id: '1',
  projectId: 'project-1',
  title: 'Sprint 1 - 사용자 인증',
  description:
    '사용자 인증 관련 기능을 검증합니다. 로그인, 회원가입, 비밀번호 찾기 등의 기능이 포함됩니다.',
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-01-15'),
  status: 'inProgress',
  createdAt: new Date('2024-12-20'),
  updatedAt: new Date('2025-01-05'),
  deletedAt: null,
  totalCases: 24,
  completedCases: 18,
  progressRate: 75,
  runCount: 5,
};

// Mock test cases
const MOCK_TEST_CASES = [
  { id: 'tc-1', code: 'TC-1001', title: '이메일 로그인 성공', status: 'passed' },
  { id: 'tc-2', code: 'TC-1002', title: '이메일 형식 검증 실패', status: 'passed' },
  { id: 'tc-3', code: 'TC-1003', title: '비밀번호 불일치 에러', status: 'passed' },
  { id: 'tc-4', code: 'TC-1004', title: '소셜 로그인 - Google', status: 'failed' },
  { id: 'tc-5', code: 'TC-1005', title: '소셜 로그인 - Kakao', status: 'passed' },
  { id: 'tc-6', code: 'TC-1006', title: '회원가입 성공', status: 'not_run' },
  { id: 'tc-7', code: 'TC-1007', title: '비밀번호 찾기 이메일 발송', status: 'not_run' },
];

const TEST_STATUS_CONFIG: Record<string, { label: string; style: string }> = {
  passed: { label: 'Passed', style: 'bg-green-500/20 text-green-300' },
  failed: { label: 'Failed', style: 'bg-red-500/20 text-red-300' },
  blocked: { label: 'Blocked', style: 'bg-amber-500/20 text-amber-300' },
  not_run: { label: 'Not Run', style: 'bg-slate-500/20 text-slate-300' },
};

export const MilestoneDetailView = () => {
  const params = useParams();
  const router = useRouter();
  const milestone = MOCK_MILESTONE; // 실제로는 milestoneId로 API 조회

  const handleRunTest = () => {
    router.push(`/projects/${params.slug}/runs/create`);
  };
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
            href={`/projects/${params.slug}/milestones`}
            className="text-text-3 hover:text-text-1 flex w-fit items-center gap-1 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            마일스톤 목록으로
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <h1 className="typo-title-heading">{milestone.title}</h1>
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
              <span className="text-primary text-2xl font-bold">{milestone.progressRate}%</span>
            </div>
            <div className="bg-bg-3 h-3 w-full rounded-full">
              <div
                className="bg-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${milestone.progressRate}%` }}
              />
            </div>
            <p className="text-text-3 mt-2 text-sm">
              {milestone.completedCases} / {milestone.totalCases} 케이스 완료
            </p>
          </div>

          {/* 통계 카드들 */}
          <div className="bg-bg-2 border-line-2 rounded-4 flex flex-col gap-1 border p-4">
            <div className="text-text-3 flex items-center gap-1.5 text-sm">
              <ListChecks className="h-4 w-4" strokeWidth={1.5} />
              <span>테스트 케이스</span>
            </div>
            <span className="text-text-1 text-2xl font-bold">{milestone.totalCases}개</span>
          </div>

          <div className="bg-bg-2 border-line-2 rounded-4 flex flex-col gap-1 border p-4">
            <div className="text-text-3 flex items-center gap-1.5 text-sm">
              <PlayCircle className="h-4 w-4" strokeWidth={1.5} />
              <span>테스트 실행</span>
            </div>
            <span className="text-text-1 text-2xl font-bold">{milestone.runCount}회</span>
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

          {MOCK_TEST_CASES.length === 0 ? (
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
              {MOCK_TEST_CASES.map((testCase) => {
                const statusConfig = TEST_STATUS_CONFIG[testCase.status] || TEST_STATUS_CONFIG.not_run;
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
          <div className="bg-bg-2 border-line-2 rounded-4 flex flex-col items-center justify-center gap-4 border-2 border-dashed py-12">
            <PlayCircle className="text-text-3 h-8 w-8" />
            <div className="text-center">
              <p className="text-text-1 font-semibold">테스트 실행 이력이 없습니다.</p>
              <p className="text-text-3 text-sm">마일스톤 기반 테스트 실행을 생성하세요.</p>
            </div>
          </div>
        </section>
      </MainContainer>
    </Container>
  );
};
