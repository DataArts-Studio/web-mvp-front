import React from 'react';

import { Container, MainContainer } from '@/shared';
import { Aside, Footer, GlobalHeader } from '@/widgets';

export const TestCasesView = () => {
  return (
    <Container className="text-text1 dark:bg-bg-1 flex min-h-screen items-center justify-center bg-zinc-50 font-sans">
      {/* Header */}
      <GlobalHeader />
      {/* Aside */}
      <Aside />
      {/* Main Content */}
      <MainContainer className="flex w-full max-w-7xl flex-1 flex-grow flex-col items-center justify-start px-4 pt-32 pb-20 text-center">
        <div id="temp-container" className="flex flex-col gap-12">
          <header className="flex gap-4">
            <div>
              <h2>테스트 케이스 관리</h2>
              <p>통개별 테스트 케이스를 생성하고 관리하세요</p>
            </div>
            <div>필터</div>
            <div>테스트 케이스 생성</div>
          </header>
          <section className="flex gap-4">
            <p>검색창</p>
            <p>검색창 필터 버튼</p>
          </section>
          <section>
            <p>테스트 케이스(표 형식)</p>
          </section>
        </div>
      </MainContainer>
      <Footer />
    </Container>
  );
};
