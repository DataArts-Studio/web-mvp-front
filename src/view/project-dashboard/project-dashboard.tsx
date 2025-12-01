'use client';
import React from 'react';

import { Container, MainContainer } from '@/shared/ui';
import { Footer } from '@/widgets/footer';
import { GlobalHeader } from '@/widgets/global-header';

export const ProjectDashboardView = () => {
  return (
    <Container className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans text-white dark:bg-black">
      <GlobalHeader />
      <MainContainer className="flex w-full max-w-5xl flex-grow flex-col items-center justify-start px-4 pt-32 pb-20 text-center">
        ㄴㅇ
      </MainContainer>
      <Footer />
    </Container>
  );
};
