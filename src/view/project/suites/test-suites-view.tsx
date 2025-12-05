import React from 'react';

import { Container, MainContainer } from '@/shared';
import { Aside } from '@/widgets';

export const TestSuitesView = () => {
  return (
    <Container className="text-text1 dark:bg-bg-1 flex min-h-screen items-center justify-center bg-zinc-50 font-sans">
      {/* Aside */}
      <Aside />
      {/* Main Content */}
      <MainContainer className="flex w-full flex-1 flex-grow items-center justify-center">
        <div id="temp-container" className="flex flex-col gap-12">
          <header className='flex'>
            <div>
              <h2>테스트 스위트 관리</h2>
              <p>관련된 테스트 케이스를 그룹으로 관리하세요</p>
            </div>
            <button>테스트 스위트 생성</button>
          </header>
          <section className="grid grid-cols-2 gap-4">
            테스트 스위트 그룹
          </section>
        </div>
      </MainContainer>
    </Container>
  );
};
