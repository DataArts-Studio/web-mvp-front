import React from 'react';

import { getTranslations } from 'next-intl/server';

import { GridBackground } from '@/shared/layout';

import { StartButton } from './start-button';

export const LandingHero = async () => {
  const t = await getTranslations('lending.hero');
  const tCta = await getTranslations('lending.cta');

  return (
    <section
      aria-labelledby="landing-title"
      className="relative isolate flex min-h-svh w-full flex-col justify-center overflow-hidden px-4 pt-28 pb-10 md:px-10"
    >
      {/* 베타 히어로 에셋: 80px 그리드, 원형 장식, 커서 */}
      <GridBackground.Grid />
      <GridBackground.Gradient />
      <GridBackground.CircleDecoration className="-z-10 max-md:top-[38%] max-md:left-[35%] max-md:h-[600px] max-md:w-[600px]" />
      <GridBackground.ArrowDecoration className="max-md:top-[30%] max-md:right-6 max-md:left-auto" />
      <div
        aria-hidden="true"
        className="from-bg-1 pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t to-transparent"
      />

      <div className="relative mx-auto flex w-full max-w-[1200px] flex-col gap-6 md:gap-8">
        <p className="animate-fade-in-up text-text-3 flex items-center gap-2 text-xs md:text-sm">
          <span className="text-primary font-medium">{t('eyebrowRun')}</span>
          <span aria-hidden="true">·</span>
          <span>{t('eyebrow')}</span>
        </p>
        <h1
          id="landing-title"
          className="animate-fade-in-up text-text-1 text-[42px] leading-[1.2] font-bold tracking-[-0.04em] sm:text-6xl md:text-[96px]"
        >
          {t.rich('titleLine1', {
            mbr: () => (
              <>
                <br className="sm:hidden" />
                <span className="hidden sm:inline"> </span>
              </>
            ),
          })}
          <br />
          <span className="text-primary">{t('titleHighlight')}</span>
          {t('titleLine2')}
        </h1>
        <p className="animate-fade-in-up-delay text-text-2 text-base leading-[1.6] md:text-xl">
          {t.rich('subtitle', {
            br: () => (
              <>
                <br className="max-sm:hidden" />
                <span className="sm:hidden"> </span>
              </>
            ),
          })}
        </p>
        <div
          role="group"
          aria-label={tCta('sectionAria')}
          className="animate-fade-in-up-delay mt-2 flex flex-wrap items-center gap-3"
        >
          <StartButton location="landing_hero" ariaLabel={tCta('buttonAria')} />
          <a
            href="#run"
            className="text-text-1 hover:border-primary flex h-14 items-center rounded-md border border-white/20 px-7 text-base font-bold transition-colors"
          >
            {t('tryIt')}
          </a>
        </div>
      </div>

      <p className="text-text-3 border-primary/60 relative mx-auto mt-16 w-full max-w-[1200px] border-l-2 pl-3 text-xs md:mt-24 md:text-sm">
        {t('scrollCue')}
      </p>
    </section>
  );
};
