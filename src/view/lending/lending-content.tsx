'use client';

import React from 'react';
import { MainContainer } from '@/shared/lib/primitives';
import { LendingHeader } from '@/widgets/lending';
import { useBetaBanner } from '@/widgets/global-header';
import { LendingCta } from './lending-cta';

export const LendingContent = () => {
  const { isVisible: isBannerVisible } = useBetaBanner();

  return (
    <MainContainer
      aria-label="메인 콘텐츠"
      className={`mx-auto flex flex-1 w-full max-w-6xl items-center px-4 transition-[padding-top] duration-200 ${isBannerVisible ? 'pt-10' : 'pt-4'}`}
    >
      <div className="flex w-full flex-col items-start gap-9 pl-8">
        <LendingHeader />
        <LendingCta />
      </div>
    </MainContainer>
  );
};
