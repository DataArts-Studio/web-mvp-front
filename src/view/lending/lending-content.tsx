import React from 'react';
import { MainContainer } from '@/shared/lib/primitives';
import { LendingHeader } from '@/widgets/lending';
import { LendingCta } from './lending-cta';
import { LendingFeatures } from './lending-features';
import { BannerPaddingWrapper } from './banner-padding-wrapper';

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
