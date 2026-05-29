'use client';

import { useEffect } from 'react';

import Link from 'next/link';

import * as Sentry from '@sentry/nextjs';
import { AlertTriangle } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function SettingsError({ error, reset }: ErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
        <AlertTriangle className="h-8 w-8 text-red-400" />
      </div>
      <h2 className="text-text-1 text-xl font-bold">설정을 불러올 수 없습니다</h2>
      <p className="text-text-2 max-w-md text-sm">
        설정 데이터를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.
      </p>
      <div className="mt-2 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-4 bg-primary text-text-1 hover:bg-primary/90 inline-flex cursor-pointer items-center px-5 py-2.5 text-sm font-semibold transition-colors"
        >
          다시 시도
        </button>
        <Link
          href="/"
          className="rounded-4 border-line-2 text-text-1 hover:bg-bg-3 inline-flex items-center border px-5 py-2.5 text-sm font-semibold transition-colors"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
