'use client';

import { useEffect } from 'react';
import Image from 'next/image';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // 에러 로깅 서비스에 에러 보고
    console.error('[Error Page]', error);
  }, [error]);

  return (
    <div className="relative flex min-h-screen flex-col bg-bg-1">
      {/* 500 Background Text */}
      <p
        className="pointer-events-none absolute left-1/2 top-[44px] -translate-x-1/2 select-none text-center text-[clamp(120px,20vw,393px)] font-bold leading-[1.4] tracking-[-0.04em] text-[#063f2e]"
        aria-hidden="true"
      >
        500
      </p>

      {/* Main Content */}
      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-6 lg:flex-row lg:items-center lg:justify-between lg:px-12">
        {/* Text Section */}
        <div className="flex flex-col gap-3 pt-32 lg:pt-0">
          <h1 className="text-[clamp(28px,5vw,48px)] font-bold leading-[1.4] tracking-[-0.04em] text-text-1">
            앗! 문제가 발생했어요.
          </h1>
          <p className="text-[clamp(16px,2vw,24px)] leading-[1.4] tracking-[-0.04em] text-text-2">
            잠시 후 다시 시도해 주세요.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={reset}
              className="inline-flex w-fit cursor-pointer items-center justify-center rounded-4 bg-primary px-6 py-3 text-body2 font-semibold text-bg-1 transition-colors hover:bg-primary/90"
            >
              다시 시도
            </button>
            <a
              href="/"
              className="inline-flex w-fit items-center justify-center rounded-4 border border-line-2 px-6 py-3 text-body2 font-semibold text-text-1 transition-colors hover:bg-bg-3"
            >
              홈으로 돌아가기
            </a>
          </div>
        </div>

        {/* Illustration */}
        <div className="relative mt-8 h-[300px] w-full max-w-[500px] self-center lg:mt-0 lg:h-[527px] lg:w-[613px]">
          <Image
            src="/images/error-teacup.png"
            alt="엎질러진 찻잔 일러스트"
            fill
            className="object-contain"
            priority
          />
        </div>
      </main>

      {/* Decorative Elements */}
      <div
        className="pointer-events-none absolute left-[15%] top-[70%] h-7 w-7 rotate-90 border-2 border-primary"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-[10%] right-[20%] h-7 w-7 border-2 border-primary"
        aria-hidden="true"
      />
    </div>
  );
}
