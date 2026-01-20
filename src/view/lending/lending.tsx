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
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);

  return (
    <GridBackground.Root>
      <GridBackground.Grid />
      <GridBackground.Gradient />
      <GridBackground.CircleDecoration />
      <GridBackground.ArrowDecoration />
      {/* Contents */}
      <Container
        id="container"
        className="flex min-h-screen w-full flex-1 items-start justify-start bg-bg-1 font-sans text-text1"
      >
        {/* Header */}
        <GlobalHeader />
        {/* Main Content */}
        <MainContainer className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 pt-16">
          {/* 메인 헤드라인 + 서브타이틀 / 슬로건 */}
          <div className="flex w-full flex-col items-start gap-9 pl-8">
            <Logo className="h-12 w-48" />
            <LendingHeader />
            {/* CTA Section */}
            <section className="relative z-10">
              <DSButton
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="flex h-16 w-80 min-w-[11.25rem] items-center justify-center gap-[0.63rem] p-5"
              >
                무료로 시작하기
              </DSButton>
            </section>
          </div>
          {isCreateModalOpen && (
            <ProjectCreateForm onClick={() => setIsCreateModalOpen(false)} />
          )}
        </MainContainer>
        <Footer />
      </Container>
    </GridBackground.Root>
  );
};
