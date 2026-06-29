'use client';

import { useEffect, useMemo, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { CHALLENGES, TRACK_LABEL } from '@/shared/challenges/registry';
import { PlaygroundHeader } from '@/view/challenges/playground-header';
import { createSupabaseBrowserAuthClient } from '@testea/db/src/client/supabase/auth-client';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  Flame,
  History,
  LayoutDashboard,
  ListChecks,
  MessageSquareText,
  PenLine,
  Trophy,
} from 'lucide-react';

type AuthState = 'checking' | 'authenticated' | 'unauthenticated' | 'unavailable';

type DashboardUser = {
  email?: string;
};

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

const sidebarItems = [
  { label: '대시보드', href: '/dashboard', icon: LayoutDashboard, active: true },
  { label: '문제 풀이', href: '/challenges', icon: ListChecks, active: false },
  { label: '작성한 글', href: '#posts', icon: MessageSquareText, active: false },
] as const;

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
  const router = useRouter();
  const supabase = useMemo(() => {
    try {
      return createSupabaseBrowserAuthClient();
    } catch {
      return null;
    }
  }, []);
  const [authState, setAuthState] = useState<AuthState>('checking');
  const [user, setUser] = useState<DashboardUser | null>(null);

  useEffect(() => {
    if (!supabase) {
      setAuthState('unavailable');
      return;
    }

    let mounted = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      if (!data.user) {
        setAuthState('unauthenticated');
        router.replace('/login?next=/dashboard');
        return;
      }
      setUser({ email: data.user.email ?? undefined });
      setAuthState('authenticated');
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setUser(null);
        setAuthState('unauthenticated');
        router.replace('/login?next=/dashboard');
        return;
      }
      setUser({ email: session.user.email ?? undefined });
      setAuthState('authenticated');
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [router, supabase]);

  if (authState === 'checking') {
    return (
      <div className="bg-bg-1 text-text-1 flex min-h-screen flex-col font-sans">
        <PlaygroundHeader containerClassName="max-w-7xl" />
        <main className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-4 py-16 sm:px-6">
          <p className="text-text-2 text-sm">로그인 상태를 확인하고 있습니다...</p>
        </main>
      </div>
    );
  }

  if (authState === 'unavailable') {
    return (
      <div className="bg-bg-1 text-text-1 flex min-h-screen flex-col font-sans">
        <PlaygroundHeader containerClassName="max-w-7xl" />
        <main className="mx-auto flex w-full max-w-5xl flex-1 items-center px-4 py-16 sm:px-6">
          <section className="border-line-2 bg-bg-2 w-full rounded-lg border p-6">
            <h1 className="text-xl font-bold">로그인 환경변수가 필요합니다.</h1>
            <p className="text-text-2 mt-2 text-sm">
              대시보드를 사용하려면 Supabase Auth 환경변수를 설정해야 합니다.
            </p>
          </section>
        </main>
      </div>
    );
  }

  if (authState !== 'authenticated') {
    return (
      <div className="bg-bg-1 text-text-1 flex min-h-screen flex-col font-sans">
        <PlaygroundHeader containerClassName="max-w-7xl" />
        <main className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-4 py-16 sm:px-6">
          <p className="text-text-2 text-sm">로그인 화면으로 이동하고 있습니다...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-bg-1 text-text-1 flex min-h-screen flex-col font-sans">
      <PlaygroundHeader containerClassName="max-w-7xl" />
      <main className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[248px_1fr] lg:py-10">
        <aside className="border-line-2 bg-bg-2 h-fit rounded-lg border p-4 lg:sticky lg:top-6">
          <div className="flex items-center gap-3 px-1 py-2">
            <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-full text-base font-bold">
              {(user?.email?.[0] ?? 'Q').toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user?.email ?? 'qaground 사용자'}</p>
              <p className="text-text-3 mt-1 text-xs">로그인 사용자</p>
            </div>
          </div>

          <nav className="mt-4 grid gap-1" aria-label="대시보드 메뉴">
            {sidebarItems.map(({ label, href, icon: Icon, active }) => (
              <Link
                key={label}
                href={href}
                className={`flex h-10 items-center gap-3 rounded-md px-3 text-sm transition-colors ${
                  active
                    ? 'bg-primary/15 text-primary font-semibold'
                    : 'text-text-2 hover:bg-bg-3 hover:text-text-1'
                }`}
              >
                <Icon size={16} aria-hidden="true" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="bg-line-2 my-5 h-px" />

          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-text-3 text-xs">전체 진행률</p>
                <p className="mt-1 text-xl font-bold">1 / {CHALLENGES.length}</p>
              </div>
              <div
                className="grid size-20 place-items-center rounded-full"
                style={{
                  background: 'conic-gradient(var(--color-primary) 5%, var(--color-bg-3) 0)',
                }}
              >
                <div className="bg-bg-2 grid size-14 place-items-center rounded-full text-xs font-bold">
                  5%
                </div>
              </div>
            </div>
            <div className="grid gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-text-2">완료</span>
                <span className="font-semibold">1</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-2">진행 중</span>
                <span className="font-semibold">1</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-2">미시도</span>
                <span className="font-semibold">{CHALLENGES.length - 2}</span>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="mb-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
            <div>
              <p className="text-primary text-sm font-semibold">내 학습 홈</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">대시보드</h1>
              <p className="text-text-2 mt-2 max-w-2xl text-sm">
                {user?.email ?? '현재 계정'}의 풀이 기록, 제출 흐름, 작성 활동을 한곳에서
                확인합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 xl:justify-end">
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
            </div>
          </header>

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
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{ width: `${progress}%` }}
                    />
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
                  href="/challenges"
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

            <div id="posts" className="border-line-2 bg-bg-2 rounded-lg border p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">작성한 글</h2>
                <FileText className="text-primary" size={20} aria-hidden="true" />
              </div>
              <div className="border-line-2 bg-bg-1 rounded-lg border border-dashed p-6 text-center">
                <p className="text-text-2 text-sm">아직 작성한 글이 없습니다.</p>
                <p className="text-text-3 mt-2 text-xs">
                  글쓰기 기능이 열리면 풀이 노트와 회고가 여기에 표시됩니다.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
