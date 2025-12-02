'use client';
import React from 'react';

import { Container, MainContainer } from '@/shared/lib/primitives';
import { Footer } from '@/widgets/footer';
import { GlobalHeader } from '@/widgets/global-header';

export const ProjectDashboardView = () => {
  return (
    <Container className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans text-text1 dark:bg-bg-1">
      {/* Header */}
      <GlobalHeader />
      {/* Main Content */}
      <MainContainer className="flex w-full flex-1 max-w-7xl flex-grow flex-col items-center justify-start px-4 pt-32 pb-20 text-center">
        대시보드
      </MainContainer>
      <Footer />
    </Container>
  );
};
