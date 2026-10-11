import React from 'react';

import { getTranslations } from 'next-intl/server';

import { GridBackground } from '@/shared/layout';
import { GlobalHeader } from '@/widgets/global-header';

import { LandingFaq } from './landing-faq';
import { LandingFooter } from './landing-footer';
import { LandingHero } from './landing-hero';
import { LandingRun } from './landing-run';
import { ScrollProgress } from './scroll-progress';

/**
 * 랜딩 페이지. 페이지 전체를 하나의 테스트 실행(RUN #001)으로 보고,
 * 기능 소개를 TC-001~TC-004 케이스로 스크롤하며 하나씩 통과시킨다.
 */
export const LendingView = async () => {
  const t = await getTranslations('lending');

  return (
    <div
      id="container"
      role="document"
      aria-label={t('documentAria')}
      className="bg-bg-1 text-text-1 relative isolate flex min-h-screen w-full flex-col overflow-x-clip font-sans"
    >
      <GlobalHeader />
      <ScrollProgress />

      {/* 하단 배경: 히어로 에셋을 좌우 반전해 FAQ·푸터 쪽에 깔아 위아래 균형을 맞춘다. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[1500px] overflow-hidden"
      >
        <GridBackground.Grid className="[mask-image:linear-gradient(to_bottom,transparent,black_30%)]" />
        <GridBackground.Gradient className="bg-gradient-to-tl" />
        <GridBackground.CircleDecoration className="top-[60%] left-[calc(-972px+560px)] -scale-x-100 max-md:top-[70%] max-md:left-[-560px]" />
      </div>

      <main aria-label={t('mainAria')} className="flex w-full flex-col">
        <LandingHero />
        <LandingRun />
        <LandingFaq />
      </main>
      <LandingFooter />
    </div>
  );
};
