import React from 'react';

import { LendingHeader } from '@/widgets/lending';
import { MainContainer } from '@testea/ui';

import { BannerPaddingWrapper } from './banner-padding-wrapper';
import { LendingCta } from './lending-cta';
import { LendingFeatures } from './lending-features';

export const LendingContent = () => {
  return (
    <>
      <MainContainer
        aria-label="메인 콘텐츠"
        className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4"
      >
        <BannerPaddingWrapper>
          <LendingHeader />
          <LendingCta />
        </BannerPaddingWrapper>
      </MainContainer>
      <LendingFeatures />
    </>
  );
};
