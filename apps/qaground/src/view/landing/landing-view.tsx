import Link from 'next/link';

import { LandingAssessment } from './landing-assessment';
import { LandingComparison } from './landing-comparison';
import { LandingFooter } from './landing-footer';
import { LandingHeader } from './landing-header';
import { LandingHero } from './landing-hero';
import { LandingHowItWorks } from './landing-how-it-works';
import { LandingPillars } from './landing-pillars';
import { LandingTesteaPromo } from './landing-testea-promo';

export const LandingView = () => {
  return (
    <div className="bg-bg-1 text-text-1 flex min-h-screen w-full flex-col font-sans">
      <LandingHeader />
      <main className="flex w-full flex-col">
        <LandingHero />
        <LandingComparison />
        <LandingPillars />
        <LandingHowItWorks />
        <LandingAssessment />

        {/* 마무리 CTA */}
        <section className="w-full py-24">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-4 text-center sm:px-6">
            <h2 className="text-2xl font-bold sm:text-3xl">
              지금 <span className="text-primary">첫 연습</span>을 시작하세요
            </h2>
            <p className="text-text-2 text-sm leading-relaxed sm:text-base">
              연습 페이지를 고르고, 테스트를 작성해 제출하면 바로 채점 결과를 받습니다.
            </p>
            <Link
              href="/challenges"
              className="bg-primary rounded-button h-button-lg hover:bg-primary/90 active:bg-primary/80 inline-flex items-center justify-center px-8 font-medium text-white transition-colors"
            >
              연습 시작하기
            </Link>
          </div>
        </section>

        <LandingTesteaPromo />
      </main>
      <LandingFooter />
    </div>
  );
};
