'use client';
import React from 'react';

import { Container, MainContainer } from '@/shared/lib/primitives';
import { Footer } from '@/widgets/footer';
import { GlobalHeader } from '@/widgets/global-header';

export const ProjectDashboardView = () => {
  return (
    <Container className="text-text1 dark:bg-bg-1 flex min-h-screen items-center justify-center bg-zinc-50 font-sans">
      {/* Header */}
      <GlobalHeader />
      {/* Aside */}
      <aside className="flex flex-col gap-6">
        <div>
          <h2>로고</h2>
          <p>테스트 도구</p>
        </div>
        <div>
          <p>홈</p>
          <p>대시보드</p>
          <p>마일스톤</p>
          <p>테스트 스위트</p>
          <p>테스트 케이스</p>
        </div>
        <div>
          <h2>빠른 시작</h2>
          <p>마일스톤 생성</p>
          <p>테스트케이스 생성</p>
          <p>테스트스위트 생성</p>
        </div>
        <div>
          <p>설정</p>
          <p>도움말</p>
        </div>
      </aside>
      {/* Main Content */}
      <MainContainer className="flex w-full max-w-7xl flex-1 flex-grow flex-col items-center justify-start px-4 pt-32 pb-20 text-center">
        <div id="temp-container" className="flex flex-col gap-12">
          <header>
            <h2>Test Dashboard</h2>
            <p>통합 테스트 현황 및 빠른 작업 허브</p>
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
