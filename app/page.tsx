'use client';
import React from 'react';

import { Container } from '@/shared/ui';
import { MainContainer } from '@/shared';
import { Footer, GlobalHeader } from '@/widgets';
import { LendingHeader } from 'src/widgets';
import { Button } from 'src/shared';

export default function Home() {
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
          <Button>무료로 시작하기</Button>
        </section>
      </MainContainer>
      <Footer />
    </Container>
  );
}
