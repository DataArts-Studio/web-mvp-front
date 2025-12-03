'use client';
import React from 'react';

import { ProjectCreateForm } from '@/features';
import { Container, MainContainer } from '@/shared/lib/primitives';
import { DSButton } from '@/shared/ui';
import { LendingHeader } from '@/widgets';
import { Footer } from '@/widgets/footer';
import { GlobalHeader } from '@/widgets/global-header';
import { GridBackground } from '@/shared/ui/grid-background/grid-background';

export const LendingView = () => {
  const [isOpened, setIsOpened] = React.useState(false);
  const handleOpen = () => {
    setIsOpened((prev) => !prev);
    alert(`클릭: handleOpen실행 -> setIsOpened 실행 ${isOpened}`);
  };

  return (
    <div className="bg-[#0c0d0e] relative size-full min-h-screen overflow-hidden" data-name="Main">
      {/* Background Layer (z-0) */}
      <GridBackground />
      <div className="absolute inset-0 bg-gradient-to-br from-[#0BB57F]/5 via-transparent to-transparent pointer-events-none" />

      {/* Content Layers */}
      <Container className="text-text1 dark:bg-bg-1 flex min-h-screen items-center justify-center bg-zinc-50 font-sans">
        {/* Header */}
        <GlobalHeader />
        {/* Main Content */}
        <MainContainer className="flex w-full max-w-6xl flex-1 flex-grow flex-col items-center justify-start px-4 pt-32 pb-20 text-center">
          {/* 메인 헤드라인 + 서브타이틀 / 슬로건 */}
          <LendingHeader />
          {/* CTA Section */}
          <section className="mt-10 flex w-full justify-start relative z-10">
            <DSButton type='button' onClick={handleOpen}>무료로 시작하기</DSButton>
          </section>
          {isOpened && <ProjectCreateForm onClick={handleOpen}/>}
        </MainContainer>
        <Footer />
      </Container>
    </div>
  );
};
