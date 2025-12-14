'use client';
import React from 'react';
import { ProjectCreateForm } from '@/features';
import { Logo } from '@/shared';
import { Container, MainContainer } from '@/shared/lib/primitives';
import { DSButton } from '@/shared/ui';
import { GridBackground } from '@/shared/layout';
import { LendingHeader } from '@/widgets';
import { Footer } from '@/widgets/footer';
import { GlobalHeader } from '@/widgets/global-header';

export const LendingView = () => {
  const [isOpened, setIsOpened] = React.useState(false);
  const handleOpen = () => {
    setIsOpened((prev) => !prev);
    console.log(`클릭: handleOpen실행 -> setIsOpened 실행 ${isOpened}`);
  };
  // flex flex-1 flex-grow flex-col items-center justify-start
  return (
    <GridBackground.Root>
      <GridBackground.Grid/>
      <GridBackground.Gradient/>
      <GridBackground.CircleDecoration/>
      <GridBackground.ArrowDecoration/>
      {/* Contents */}
      <Container id='container' className="w-full text-text1 bg-bg-1 flex min-h-screen items-start justify-start flex-1 font-sans">
        {/* Header */}
        <GlobalHeader />
        {/* Main Content */}
        <MainContainer className="w-full min-h-screen mx-auto max-w-6xl grid grid-cols-10 gap-3 items-center px-4 text-center">
          {/* 메인 헤드라인 + 서브타이틀 / 슬로건 */}
          <div className="col-start-2 mx-auto flex flex-col items-start gap-9">
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
    </GridBackground.Root>
  );
};
