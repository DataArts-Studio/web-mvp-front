'use client';
import React from 'react';

import { Container, MainContainer } from '@/shared/lib/primitives';
import { Aside } from '@/widgets';

export const ProjectDashboardView = () => {
  return (
    <Container className="text-text1 dark:bg-bg-1 flex min-h-screen items-center justify-center bg-zinc-50 font-sans">
      {/* Aside */}
      <Aside/>
      {/* Main Content */}
      <MainContainer className="flex w-full flex-1 flex-grow items-center justify-center">
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
    </Container>
  );
};
