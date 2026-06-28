'use client';

import { useEffect, useMemo, useState } from 'react';

import Link from 'next/link';

import { createSupabaseBrowserAuthClient } from '@testea/db/src/client/supabase/auth-client';

export function AuthStatus() {
  const supabase = useMemo(() => {
    try {
      return createSupabaseBrowserAuthClient();
    } catch {
      return null;
    }
  }, []);
  const [user, setUser] = useState<{ email?: string } | null>(null);

  useEffect(() => {
    if (!supabase) return;

    let mounted = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (mounted) setUser(data.user ?? null);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
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

  return (
    <div className="flex items-center gap-2">
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
