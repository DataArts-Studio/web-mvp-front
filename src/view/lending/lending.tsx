'use client';
import React from 'react';

import { Container, MainContainer } from '@/shared/lib/primitives';
import { Footer } from '@/widgets/footer';
import { GlobalHeader } from '@/widgets/global-header';
import { LendingHeader } from '@/widgets';
import { DSButton } from '@/shared/ui';

export const LendingView = () => {
  return (
    <Container className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans text-text1 dark:bg-bg-1">
      {/* Header */}
      <GlobalHeader />
      {/* Main Content */}
      <MainContainer className="flex w-full flex-1 max-w-7xl flex-grow flex-col items-center justify-start px-4 pt-32 pb-20 text-center">
        {/* 메인 헤드라인 + 서브타이틀 / 슬로건 */}
        <LendingHeader/>
        {/* CTA Section */}
        <section>
          <DSButton title="무료로 시작하기"/>
        </section>
      </MainContainer>
      <Footer />
    </Container>
  );
};
