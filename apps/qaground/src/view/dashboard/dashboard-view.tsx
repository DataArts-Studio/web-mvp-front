'use client';

import Link from 'next/link';

import { CHALLENGES, TRACK_LABEL } from '@/shared/challenges/registry';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  Flame,
  History,
  PenLine,
  Trophy,
} from 'lucide-react';

import { DashboardShell } from './dashboard-shell';

const TRACKS = ['manual', 'automation', 'api'] as const;

const recentItems = [
  {
    slug: 'login-basic',
    title: '로그인 폼 검증',
    track: 'automation',
    status: '진행 중',
    score: '2/4',
    submittedAt: '오늘',
  },
  {
    slug: 'rest-api-auth-session',
    title: '인증 세션 API 테스트',
    track: 'api',
    status: '미시도',
    score: '-',
    submittedAt: '추천',
  },
  {
    slug: 'test-design-login-lockout',
    title: '로그인 잠금 테스트 설계',
    track: 'manual',
    status: '완료',
    score: '4/4',
    submittedAt: '최근',
  },
] as const;

const activityDays = [
  0, 1, 0, 2, 3, 0, 1, 4, 2, 0, 0, 1, 3, 4, 2, 1, 0, 2, 3, 0, 1, 2, 4, 3, 0, 1, 0, 2,
];

const summaryCards = [
  {
    label: '푼 문제',
    value: '1',
    unit: '문제',
    desc: '전체 문제 대비 5%',
    trend: '완료 1 · 진행 중 1',
    progress: 5,
    icon: CheckCircle2,
  },
  {
    label: '최근 제출',
    value: '3',
    unit: '회',
    desc: '오늘 제출 1회',
    trend: '마지막 활동 오늘',
    progress: 38,
    icon: History,
  },
  {
    label: '연속 학습',
    value: '1',
    unit: '일',
    desc: '목표 7일 중 1일',
    trend: '제출 이력 연동 후 자동 계산',
    progress: 14,
    icon: Flame,
  },
  {
    label: '작성한 글',
    value: '0',
    unit: '개',
    desc: '풀이 노트 준비 중',
    trend: '글쓰기 기능은 추후 제공',
    progress: 0,
    icon: PenLine,
  },
] as const;

function trackCount(track: (typeof TRACKS)[number]) {
  return CHALLENGES.filter((challenge) => challenge.track === track).length;
}

function activityClass(level: number) {
  if (level >= 4) return 'bg-primary';
  if (level === 3) return 'bg-primary/70';
  if (level === 2) return 'bg-primary/45';
  if (level === 1) return 'bg-primary/25';
  return 'bg-bg-3';
}

export function DashboardView() {
  return (
    <DashboardShell
      active="overview"
      nextPath="/dashboard"
      eyebrow="내 학습 홈"
      title="대시보드"
      description="현재 계정의 풀이 기록, 제출 흐름, 작성 활동을 한곳에서 확인합니다."
      actions={
        <>
          <Link
            href="/challenges"
            className="bg-primary rounded-button h-button-md hover:bg-primary/90 active:bg-primary/80 inline-flex items-center justify-center gap-2 px-5 text-sm font-semibold text-white transition-colors"
          >
            <BookOpen size={16} aria-hidden="true" />
            문제 계속 풀기
          </Link>
          <Link
            href="/guide"
            className="border-line-2 bg-bg-2 rounded-button h-button-md hover:border-primary/50 inline-flex items-center justify-center gap-2 border px-4 text-sm font-semibold transition-colors"
          >
            가이드 보기
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </>
      }
    >
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(({ label, value, unit, desc, trend, progress, icon: Icon }) => (
          <div
            key={label}
            className="border-line-2 bg-bg-2 relative overflow-hidden rounded-lg border p-4"
          >
            <div className="bg-primary/70 absolute inset-x-0 top-0 h-0.5" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-text-3 text-xs font-medium">{label}</p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold tracking-tight">{value}</span>
                  <span className="text-text-3 text-xs">{unit}</span>
                </div>
              </div>
              <div className="border-line-2 bg-bg-1 text-primary flex size-9 items-center justify-center rounded-md border">
                <Icon size={17} aria-hidden="true" />
              </div>
            </div>
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between gap-2 text-xs">
                <span className="text-text-2">{desc}</span>
                <span className="text-text-3">{progress}%</span>
              </div>
              <div className="bg-bg-3 h-1.5 overflow-hidden rounded-full">
                <div className="bg-primary h-full rounded-full" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <p className="text-text-3 mt-3 truncate text-xs">{trend}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_0.9fr]">
        <div className="border-line-2 bg-bg-2 rounded-lg border p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">최근 풀이</h2>
              <p className="text-text-3 mt-1 text-xs">
                제출 저장 연동 전까지는 화면 검증용 예시입니다.
              </p>
            </div>
            <Link
              href="/dashboard/practice"
              className="text-text-2 hover:text-text-1 inline-flex items-center gap-1 text-sm transition-colors"
            >
              전체 보기
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
          <ul className="divide-line-2 divide-y">
            {recentItems.map((item) => (
              <li
                key={item.slug}
                className="grid gap-3 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <Link
                    href={`/challenges/${item.slug}`}
                    className="hover:text-primary font-medium transition-colors"
                  >
                    {item.title}
                  </Link>
                  <p className="text-text-3 mt-1 text-xs">
                    {TRACK_LABEL[item.track]} · {item.submittedAt}
                  </p>
                </div>
                <span className="border-line-2 bg-bg-1 w-fit rounded-full border px-3 py-1 text-xs font-medium">
                  {item.status}
                </span>
                <span className="bg-bg-3 text-text-2 w-fit rounded-full px-3 py-1 text-xs">
                  {item.score}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-line-2 bg-bg-2 rounded-lg border p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">학습 활동</h2>
              <p className="text-text-3 mt-1 text-xs">최근 4주 풀이 리듬</p>
            </div>
            <Trophy className="text-primary" size={20} aria-hidden="true" />
          </div>
          <div className="grid grid-cols-7 gap-2">
            {activityDays.map((level, index) => (
              <div
                key={`${level}-${index}`}
                className={`${activityClass(level)} aspect-square rounded-[4px]`}
                aria-label={`활동 레벨 ${level}`}
              />
            ))}
          </div>
          <div className="text-text-3 mt-4 flex items-center justify-between text-xs">
            <span>적음</span>
            <span>많음</span>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="border-line-2 bg-bg-2 rounded-lg border p-5">
          <h2 className="text-lg font-semibold">트랙별 진행률</h2>
          <div className="mt-5 flex flex-col gap-4">
            {TRACKS.map((track) => (
              <div key={track}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span>{TRACK_LABEL[track]}</span>
                  <span className="text-text-3">0 / {trackCount(track)}</span>
                </div>
                <div className="bg-bg-3 h-2 overflow-hidden rounded-full">
                  <div className="bg-primary h-full w-0 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-line-2 bg-bg-2 rounded-lg border p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">내가 쓴 글</h2>
              <p className="text-text-3 mt-1 text-xs">커뮤니티에 작성한 글입니다.</p>
            </div>
            <FileText className="text-primary" size={20} aria-hidden="true" />
          </div>
          <div className="border-line-2 bg-bg-1 rounded-lg border border-dashed p-6 text-center">
            <p className="text-text-2 text-sm">아직 작성한 글이 없습니다.</p>
            <p className="text-text-3 mt-2 text-xs">
              커뮤니티에 작성한 글이 생기면 여기에 표시됩니다.
            </p>
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}
