'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { AlertTriangle } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function CasesError({ error, reset }: ErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
        <AlertTriangle className="h-8 w-8 text-red-400" />
      </div>
      <h2 className="text-xl font-bold text-text-1">테스트 케이스를 불러올 수 없습니다</h2>
      <p className="max-w-md text-sm text-text-2">
        테스트 케이스 데이터를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.
      </p>
      <div className="mt-2 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex cursor-pointer items-center rounded-4 bg-primary px-5 py-2.5 text-sm font-semibold text-text-1 transition-colors hover:bg-primary/90"
        >
          다시 시도
        </button>
        <a
          href="/"
          className="inline-flex items-center rounded-4 border border-line-2 px-5 py-2.5 text-sm font-semibold text-text-1 transition-colors hover:bg-bg-3"
        >
          홈으로 돌아가기
        </a>
      </div>
    </div>
  );
}
