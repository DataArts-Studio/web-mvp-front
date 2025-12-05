import React from 'react';

import { Container, MainContainer } from '@/shared';
import { Aside, Footer, GlobalHeader } from '@/widgets';

export const MilestonesView = () => {
  return (
    <Container className="text-text1 dark:bg-bg-1 flex min-h-screen items-center justify-center bg-zinc-50 font-sans">
      {/* Header */}
      <GlobalHeader />
      {/* Aside */}
      <Aside />
      {/* Main Content */}
      <MainContainer className="flex w-full max-w-7xl flex-1 flex-grow flex-col items-center justify-start px-4 pt-32 pb-20 text-center">
        <div id="temp-container" className="flex flex-col gap-12">
          <header className='flex gap-4'>
            <div>
              <h2>마일스톤 관리</h2>
              <p>프로젝트의 주요 목표와 일정을 관리하세요</p>
            </div>
            <button>테스트 스위트 생성</button>
          </header>
          <section>
            <p>마일스톤 섹션</p>
          </section>
        </div>
      </MainContainer>
      <Footer />
    </Container>
  );
};
