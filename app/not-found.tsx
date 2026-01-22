import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col bg-bg-1">
      {/* 404 Background Text */}
      <p
        className="pointer-events-none absolute left-1/2 top-[44px] -translate-x-1/2 select-none text-center text-[clamp(120px,20vw,393px)] font-bold leading-[1.4] tracking-[-0.04em] text-[#063f2e]"
        aria-hidden="true"
      >
        404
      </p>

      {/* Main Content */}
      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-6 lg:flex-row lg:items-center lg:justify-between lg:px-12">
        {/* Text Section */}
        <div className="flex flex-col gap-3 pt-32 lg:pt-0">
          <h1 className="text-[clamp(28px,5vw,48px)] font-bold leading-[1.4] tracking-[-0.04em] text-text-1">
            이런! 찾으시는 페이지가 없어요.
          </h1>
          <p className="text-[clamp(16px,2vw,24px)] leading-[1.4] tracking-[-0.04em] text-text-2">
            주소가 잘못되었거나 사라진 페이지입니다.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex w-fit items-center justify-center rounded-4 bg-primary px-6 py-3 text-body2 font-semibold text-bg-1 transition-colors hover:bg-primary/90"
          >
            홈으로 돌아가기
          </Link>
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
