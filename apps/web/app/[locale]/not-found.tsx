import { useTranslations } from 'next-intl';
import Image from 'next/image';

import { Link } from '@/i18n/navigation';

export default function NotFound() {
  const t = useTranslations('notFound');

  return (
    <div className="bg-bg-1 relative flex min-h-screen flex-col">
      {/* 404 Background Text */}
      <p
        className="pointer-events-none absolute top-[44px] left-1/2 -translate-x-1/2 text-center text-[clamp(120px,20vw,393px)] leading-[1.4] font-bold tracking-[-0.04em] text-[#063f2e] select-none"
        aria-hidden="true"
      >
        404
      </p>

      {/* Main Content */}
      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-6 lg:flex-row lg:items-center lg:justify-between lg:px-12">
        {/* Text Section */}
        <div className="flex flex-col gap-3 pt-32 lg:pt-0">
          <h1 className="text-text-1 text-[clamp(28px,5vw,48px)] leading-[1.4] font-bold tracking-[-0.04em]">
            {t('title')}
          </h1>
          <p className="text-text-2 text-[clamp(16px,2vw,24px)] leading-[1.4] tracking-[-0.04em]">
            {t('description')}
          </p>
          <Link
            href="/"
            className="rounded-4 bg-primary text-body2 text-bg-1 hover:bg-primary/90 mt-6 inline-flex w-fit items-center justify-center px-6 py-3 font-semibold transition-colors"
          >
            {t('backHome')}
          </Link>
        </div>

        {/* Illustration */}
        <div className="relative mt-8 h-[300px] w-full max-w-[500px] self-center lg:mt-0 lg:h-[527px] lg:w-[613px]">
          <Image
            src="/teacup/tea-cup-dizzy.svg"
            alt={t('illustrationAlt')}
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
