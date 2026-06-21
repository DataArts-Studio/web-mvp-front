import React from 'react';

import { getTranslations } from 'next-intl/server';

import { LendingHeader } from '@/widgets/lending';
import { MainContainer } from '@testea/ui';

import { BannerPaddingWrapper } from './banner-padding-wrapper';
import { LendingCta } from './lending-cta';
import { LendingFeatures } from './lending-features';

export const LendingContent = async () => {
  const t = await getTranslations('lending');

  return (
    <>
      <MainContainer
        aria-label={t('mainAria')}
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
