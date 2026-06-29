'use client';

import { useEffect, useMemo, useState } from 'react';

import Link from 'next/link';

import { createSupabaseBrowserAuthClient } from '@testea/db/src/client/supabase/auth-client';
import { ChevronDown, LayoutDashboard, LogOut, UserCircle } from 'lucide-react';

type AuthStatusProps = {
  variant?: 'inline' | 'dropdown';
};

export function AuthStatus({ variant = 'inline' }: AuthStatusProps = {}) {
  const supabase = useMemo(() => {
    try {
      return createSupabaseBrowserAuthClient();
    } catch {
      return null;
    }
  }, []);
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    let mounted = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (mounted) setUser(data.user ?? null);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) setMenuOpen(false);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  if (!supabase) {
    return null;
  }

  if (!user) {
    return (
      <Link href="/login" className="text-text-2 hover:text-text-1 text-sm transition-colors">
        로그인
      </Link>
    );
  }

  if (variant === 'dropdown') {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          className="border-line-2 bg-bg-2 hover:border-primary/50 flex h-9 items-center gap-2 rounded-full border px-2.5 transition-colors"
          aria-label="계정 메뉴"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
        >
          <UserCircle className="text-primary" size={19} aria-hidden="true" />
          <ChevronDown
            className={`text-text-3 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
            size={14}
            aria-hidden="true"
          />
        </button>

        {menuOpen ? (
          <div
            className="border-line-2 bg-bg-1 absolute top-11 right-0 z-50 w-64 rounded-lg border p-2 shadow-lg"
            role="menu"
          >
            <div className="border-line-2 mb-2 border-b px-2 pb-2">
              <p className="text-text-3 text-xs">로그인 계정</p>
              <p className="mt-1 truncate text-sm font-medium">{user.email ?? 'qaground 사용자'}</p>
            </div>
            <Link
              href="/dashboard"
              onClick={() => setMenuOpen(false)}
              className="hover:bg-bg-3 flex h-9 items-center gap-2 rounded-md px-2 text-sm transition-colors"
              role="menuitem"
            >
              <LayoutDashboard size={15} aria-hidden="true" />
              대시보드
            </Link>
            <button
              type="button"
              onClick={() => void supabase.auth.signOut()}
              className="text-text-2 hover:bg-bg-3 hover:text-text-1 flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition-colors"
              role="menuitem"
            >
              <LogOut size={15} aria-hidden="true" />
              로그아웃
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/dashboard" className="text-text-2 hover:text-text-1 text-sm transition-colors">
        대시보드
      </Link>
      <span className="text-text-3 hidden max-w-40 truncate text-xs sm:inline">{user.email}</span>
      <button
        type="button"
        onClick={() => void supabase.auth.signOut()}
        className="text-text-2 hover:text-text-1 text-sm transition-colors"
      >
        로그아웃
      </button>
    </div>
  );
}
