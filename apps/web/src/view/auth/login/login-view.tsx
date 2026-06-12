import React from 'react';

import { signInWithGithub, signInWithGoogle } from '@/features/auth';
import { Github } from 'lucide-react';

// Google 브랜드 G (4-color). lucide 에 브랜드 아이콘이 없어 인라인.
const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.29 9.14 4.75 12 4.75Z"
    />
  </svg>
);

const providerButtonClass =
  'flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-line-2 bg-bg-1 text-sm font-medium text-text-1 transition-colors hover:bg-bg-3 disabled:opacity-50';

interface LoginViewProps {
  error?: string;
}

export const LoginView = ({ error }: LoginViewProps) => {
  return (
    <main className="bg-bg-1 flex min-h-screen items-center justify-center px-6">
      <div className="bg-bg-2 border-line-2 shadow-4 w-full max-w-[400px] rounded-2xl border p-8">
        <header className="mb-8 flex flex-col items-center gap-2 text-center">
          <span className="text-primary text-2xl font-bold tracking-tight">Testea</span>
          <h1 className="text-text-1 text-xl font-bold">로그인</h1>
          <p className="text-text-3 text-sm">소셜 계정으로 계속하기</p>
        </header>

        {error && (
          <div className="border-system-red/30 bg-system-red/10 text-system-red mb-5 rounded-lg border px-4 py-3 text-sm">
            로그인에 실패했습니다. 다시 시도해 주세요.
          </div>
        )}

        <div className="flex flex-col gap-3">
          <form action={signInWithGoogle}>
            <button type="submit" className={providerButtonClass}>
              <GoogleIcon />
              Google로 계속하기
            </button>
          </form>
          <form action={signInWithGithub}>
            <button type="submit" className={providerButtonClass}>
              <Github className="h-5 w-5" />
              GitHub로 계속하기
            </button>
          </form>
        </div>

        <p className="text-text-3 mt-8 text-center text-xs leading-relaxed">
          계속하면 Testea의 서비스 약관 및 개인정보 처리방침에 동의하는 것으로 간주됩니다.
        </p>
      </div>
    </main>
  );
};
