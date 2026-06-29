'use client';

import { useEffect, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { createSupabaseBrowserAuthClient } from '@testea/db/src/client/supabase/auth-client';

const ENV_ERROR = '로그인 환경변수가 아직 설정되지 않았습니다.';
const PROVIDERS = [
  { id: 'google', label: 'Google로 계속하기' },
  { id: 'github', label: 'GitHub로 계속하기' },
] as const;

function getAuthErrorMessage(message?: string): string {
  if (!message) return '로그인에 실패했습니다. 잠시 후 다시 시도해주세요.';
  if (message.includes('provider is not enabled')) {
    return '아직 Supabase 외부 로그인 공급자가 활성화되지 않았습니다.';
  }
  return message;
}

export function LoginForm({ nextPath = '/dashboard' }: { nextPath?: string }) {
  const router = useRouter();
  const supabase = useMemo(() => {
    try {
      return createSupabaseBrowserAuthClient();
    } catch {
      return null;
    }
  }, []);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [error, setError] = useState(supabase ? '' : ENV_ERROR);

  useEffect(() => {
    if (!supabase) return;

    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        router.replace(nextPath);
      }
    });
  }, [nextPath, router, supabase]);

  const signIn = async (provider: (typeof PROVIDERS)[number]['id']) => {
    if (!supabase) {
      setError(ENV_ERROR);
      return;
    }

    setLoadingProvider(provider);
    setError('');
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/login?next=${encodeURIComponent(nextPath)}`,
      },
    });

    if (signInError) {
      setLoadingProvider(null);
      setError(getAuthErrorMessage(signInError.message));
    }
  };

  return (
    <div className="border-line-2 bg-bg-2 flex w-full flex-col gap-4 rounded-2xl border p-6">
      <div>
        <h1 className="text-xl font-bold">로그인</h1>
        <p className="text-text-2 mt-2 text-sm leading-relaxed">
          qaground와 Testea에서 함께 사용할 계정입니다. 비밀번호는 저장하지 않고 외부 로그인
          공급자로 인증합니다.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {PROVIDERS.map((provider) => (
          <button
            key={provider.id}
            type="button"
            onClick={() => void signIn(provider.id)}
            disabled={!!loadingProvider || !supabase}
            className="border-line-3 bg-bg-3 rounded-button text-text-1 hover:bg-bg-1 active:bg-bg-1/80 h-button-md inline-flex items-center justify-center border px-5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingProvider === provider.id ? '연결 중...' : provider.label}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="text-system-red text-sm">
          {error}
        </p>
      )}
      <p className="text-text-3 text-xs leading-relaxed">
        배포 전에는 Supabase Auth의 Google/GitHub 공급자와 redirect URL 설정이 완료된 환경에서만
        동작합니다.
      </p>
    </div>
  );
}
