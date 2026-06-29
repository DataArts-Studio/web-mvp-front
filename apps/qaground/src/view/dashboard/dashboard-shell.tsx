'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { CHALLENGES } from '@/shared/challenges/registry';
import { PlaygroundHeader } from '@/view/challenges/playground-header';
import { createSupabaseBrowserAuthClient } from '@testea/db/src/client/supabase/auth-client';
import { LayoutDashboard, ListChecks, Settings } from 'lucide-react';

type AuthState = 'checking' | 'authenticated' | 'unauthenticated' | 'unavailable';

type DashboardUser = {
  email?: string;
};

type DashboardSection = 'overview' | 'practice' | 'settings';

type DashboardShellProps = {
  active: DashboardSection;
  nextPath: string;
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
};

const sidebarItems = [
  { key: 'overview', label: '대시보드', href: '/dashboard', icon: LayoutDashboard },
  { key: 'practice', label: '문제 풀이', href: '/dashboard/practice', icon: ListChecks },
  { key: 'settings', label: '설정', href: '/dashboard/settings', icon: Settings },
] as const;

export function DashboardShell({
  active,
  nextPath,
  eyebrow,
  title,
  description,
  actions,
  children,
}: DashboardShellProps) {
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
        router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
        return;
      }
      setUser({ email: data.user.email ?? undefined });
      setAuthState('authenticated');
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setUser(null);
        setAuthState('unauthenticated');
        router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
        return;
      }
      setUser({ email: session.user.email ?? undefined });
      setAuthState('authenticated');
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [nextPath, router, supabase]);

  if (authState === 'checking') {
    return (
      <div className="bg-bg-1 text-text-1 flex min-h-screen flex-col font-sans">
        <PlaygroundHeader containerClassName="max-w-7xl" showIssueReportButton={false} />
        <main className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-4 py-16 sm:px-6">
          <p className="text-text-2 text-sm">로그인 상태를 확인하고 있습니다...</p>
        </main>
      </div>
    );
  }

  if (authState === 'unavailable') {
    return (
      <div className="bg-bg-1 text-text-1 flex min-h-screen flex-col font-sans">
        <PlaygroundHeader containerClassName="max-w-7xl" showIssueReportButton={false} />
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
        <PlaygroundHeader containerClassName="max-w-7xl" showIssueReportButton={false} />
        <main className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-4 py-16 sm:px-6">
          <p className="text-text-2 text-sm">로그인 화면으로 이동하고 있습니다...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-bg-1 text-text-1 flex min-h-screen flex-col font-sans">
      <PlaygroundHeader containerClassName="max-w-7xl" showIssueReportButton={false} />
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
            {sidebarItems.map(({ key, label, href, icon: Icon }) => {
              const isActive = key === active;
              return (
                <Link
                  key={key}
                  href={href}
                  className={`flex h-10 items-center gap-3 rounded-md px-3 text-sm transition-colors ${
                    isActive
                      ? 'bg-primary/15 text-primary font-semibold'
                      : 'text-text-2 hover:bg-bg-3 hover:text-text-1'
                  }`}
                >
                  <Icon size={16} aria-hidden="true" />
                  {label}
                </Link>
              );
            })}
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
                <span className="text-text-2">실패</span>
                <span className="font-semibold">{CHALLENGES.length - 1}</span>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="mb-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
            <div>
              <p className="text-primary text-sm font-semibold">{eyebrow}</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">{title}</h1>
              <p className="text-text-2 mt-2 max-w-2xl text-sm">{description}</p>
            </div>
            {actions ? <div className="flex flex-wrap gap-2 xl:justify-end">{actions}</div> : null}
          </header>
          {children}
        </div>
      </main>
    </div>
  );
}
