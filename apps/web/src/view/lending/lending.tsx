import React from 'react';
import { Container } from '@testea/ui';
import { GridBackground } from '@/shared/layout';
import { GlobalHeader } from '@/widgets/global-header';
import { Footer } from '@/widgets/footer';
import { LendingContent } from './lending-content';

export const LendingView = () => {
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
        aria-label="Testea 랜딩 페이지"
        className="flex min-h-screen w-full flex-col bg-bg-1 font-sans text-text1"
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
