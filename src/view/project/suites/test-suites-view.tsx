import React from 'react';

import { Container, MainContainer } from '@/shared';
import { Aside, Footer, GlobalHeader } from '@/widgets';

export const TestSuitesView = () => {
  return (
    <Container className="text-text1 dark:bg-bg-1 flex min-h-screen items-center justify-center bg-zinc-50 font-sans">
      {/* Header */}
      <GlobalHeader />
      {/* Aside */}
      <Aside />
      {/* Main Content */}
      <MainContainer className="flex w-full max-w-7xl flex-1 flex-grow flex-col items-center justify-start px-4 pt-32 pb-20 text-center">
        <div id="temp-container" className="flex flex-col gap-12">
          <header className='flex'>
            <div>
              <h2>테스트 스위트 관리</h2>
              <p>관련된 테스트 케이스를 그룹으로 관리하세요</p>
            </div>
            <button>테스트 스위트 생성</button>
          </header>
          <section>
            <h1>그래프 섹션</h1>
            <h2>Test Execution Trend</h2>
            <p>지난 7일간 테스트 실행 추이</p>
          </section>
          <section>
            <p>todo: aside로 배치 고민중</p>
            <h2>빠른 시작</h2>
            <div className="flex gap-4">
              <article>마일스톤 생성</article>
              <article>테스트케이스 생성</article>
              <article>테스트스위트 생성</article>
            </div>
          </section>
          <section className="grid grid-cols-2 gap-4">
            <article>마일스톤</article>
            <article>실행중인 테스트</article>
            <article>테스트 케이스 관리</article>
            <article>테스트 스위트 관리</article>
          </section>
        </div>
      </MainContainer>
      <Footer />
    </Container>
  );
};
