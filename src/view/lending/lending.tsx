'use client';
import React from 'react';

import Image from 'next/image';

import { ProjectCreateForm } from '@/features';
import { Logo } from '@/shared';
import { Container, MainContainer } from '@/shared/lib/primitives';
import { DSButton } from '@/shared/ui';
import { GridBackground } from '@/shared/ui/grid-background/grid-background';
import { LendingHeader } from '@/widgets';
import { Footer } from '@/widgets/footer';
import { GlobalHeader } from '@/widgets/global-header';

export const LendingView = () => {
  const [isOpened, setIsOpened] = React.useState(false);
  const handleOpen = () => {
    setIsOpened((prev) => !prev);
    console.log(`클릭: handleOpen실행 -> setIsOpened 실행 ${isOpened}`);
  };

  return (
    <div className="relative size-full min-h-screen overflow-hidden bg-bg-1" data-name="Main">
      {/* Background Layer (z-0) */}
      <GridBackground />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0BB57F]/5 via-transparent to-transparent" />
      <div className="pointer-events-none absolute top-[84px] left-[calc(60%+5px)] z-0 h-[972px] w-[972px] opacity-30 select-none">
        <Image
          src="/backgrounds/circular.svg"
          width={1137.1}
          height={972.6}
          alt="Arrow"
          className="absolute top-0 left-0 z-10"
        />
      </div>
      <div className="pointer-events-none absolute top-[460px] left-[calc(80%-153px)] z-10 h-[50px] w-[50px] select-none">
        <Image
          src="/backgrounds/arrow.svg"
          width={37.5}
          height={37.5}
          alt="Arrow"
          className="absolute top-0 left-0 z-10"
        />
      </div>
      {/* Contents */}
      <Container className="text-text1 dark:bg-bg-1 flex min-h-screen items-start justify-start bg-zinc-50 font-sans">
        {/* Header */}
        <GlobalHeader />
        {/* Main Content */}
        <MainContainer className="flex w-full max-w-6xl flex-1 flex-grow flex-col items-center justify-start px-4 mt-48 ml-80 pb-20 text-center">
          {/* 메인 헤드라인 + 서브타이틀 / 슬로건 */}
          <div className="w-[47.56rem] flex flex-col items-start gap-9">
            <Logo className="h-12 w-48" />
            <LendingHeader />
            {/* CTA Section */}
            <section className="relative z-10 flex items-center gap-[0.63rem]">
              <DSButton variant="ghost" type="button" onClick={() => alert("준비중 입니다.")} className='flex w-80 h-16 min-w-[11.25rem] p-5 justify-center items-center gap-[0.63rem]'>
                자세히 알아보기
              </DSButton>
              <DSButton type="button" onClick={handleOpen} className='flex w-80 h-16 min-w-[11.25rem] p-5 justify-center items-center gap-[0.63rem]'>
                무료로 시작하기
              </DSButton>
            </section>
          </div>
          {isOpened && <ProjectCreateForm onClick={handleOpen} />}
        </MainContainer>
        <Footer />
      </Container>
    </div>
  );
};
