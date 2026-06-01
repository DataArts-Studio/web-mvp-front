import React from 'react';

import { getTranslations } from 'next-intl/server';

import { GridBackground } from '@/shared/layout';
import { Footer } from '@/widgets/footer';
import { GlobalHeader } from '@/widgets/global-header';
import { Container } from '@testea/ui';

import { LendingContent } from './lending-content';

export const LendingView = async () => {
  const t = await getTranslations('lending');

  return (
    <GridBackground.Root>
      <GridBackground.Grid />
      <GridBackground.Gradient />
      <GridBackground.CircleDecoration />
      <GridBackground.ArrowDecoration />
      {/* Contents */}
      <Container
        id="container"
        role="document"
        aria-label={t('documentAria')}
        className="bg-bg-1 text-text1 flex min-h-screen w-full flex-col font-sans"
      >
        {/* Header */}
        <GlobalHeader />
        {/* Main Content */}
        <LendingContent />
        <Footer />
      </Container>
    </GridBackground.Root>
  );
};
