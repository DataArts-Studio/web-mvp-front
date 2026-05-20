'use client';

import { useEffect } from 'react';

import Image from 'next/image';

import * as Sentry from '@sentry/nextjs';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="bg-bg-1 relative flex min-h-screen flex-col">
      {/* 500 Background Text */}
      <p
        className="pointer-events-none absolute top-[44px] left-1/2 -translate-x-1/2 text-center text-[clamp(120px,20vw,393px)] leading-[1.4] font-bold tracking-[-0.04em] text-[#063f2e] select-none"
        aria-hidden="true"
      >
        500
      </p>

      {/* Main Content */}
      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-6 lg:flex-row lg:items-center lg:justify-between lg:px-12">
        {/* Text Section */}
        <div className="flex flex-col gap-3 pt-32 lg:pt-0">
          <h1 className="text-text-1 text-[clamp(28px,5vw,48px)] leading-[1.4] font-bold tracking-[-0.04em]">
            앗! 문제가 발생했어요.
          </h1>
          <p className="text-text-2 text-[clamp(16px,2vw,24px)] leading-[1.4] tracking-[-0.04em]">
            잠시 후 다시 시도해 주세요.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={reset}
              className="rounded-4 bg-primary text-body2 text-text-1 hover:bg-primary/90 inline-flex w-fit cursor-pointer items-center justify-center px-6 py-3 font-semibold transition-colors"
            >
              다시 시도
            </button>
            <a
              href="/"
              className="rounded-4 border-line-2 text-body2 text-text-1 hover:bg-bg-3 inline-flex w-fit items-center justify-center border px-6 py-3 font-semibold transition-colors"
            >
              홈으로 돌아가기
            </a>
          </div>
        </div>

        {/* Illustration */}
        <div className="relative mt-8 h-[300px] w-full max-w-[500px] self-center lg:mt-0 lg:h-[527px] lg:w-[613px]">
          <Image
            src="/teacup/tea-cup-dizzy.svg"
            alt="엎질러진 찻잔 일러스트"
            fill
            className="object-contain"
            priority
          />
        </div>
      </main>

      {/* Decorative Elements */}
      <div
        className="border-primary pointer-events-none absolute top-[70%] left-[15%] h-7 w-7 rotate-90 border-2"
        aria-hidden="true"
      />
      <div
        className="border-primary pointer-events-none absolute right-[20%] bottom-[10%] h-7 w-7 border-2"
        aria-hidden="true"
      />
    </div>
  );
}
