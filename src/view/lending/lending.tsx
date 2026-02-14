'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ProjectCreateForm, BetaNoticePopup } from '@/features';
import { LoadingSpinner, Logo } from '@/shared';
import { Container, MainContainer } from '@/shared/lib/primitives';
import { DSButton } from '@/shared/ui';
import { GridBackground } from '@/shared/layout';
import { LendingHeader } from '@/widgets';
import { Footer } from '@/widgets/footer';
import { GlobalHeader, useBetaBanner } from '@/widgets/global-header';
import { track, LANDING_EVENTS } from '@/shared/lib/analytics';

export const LendingView = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const { isVisible: isBannerVisible } = useBetaBanner();

  return (
    <GridBackground.Root>
      <GridBackground.Grid />
      <GridBackground.Gradient />
      <GridBackground.CircleDecoration />
      <GridBackground.ArrowDecoration />
      {/* Contents */}
      <Container
        id="container"
        role="document"
        aria-label="Testea 랜딩 페이지"
        className="flex min-h-screen w-full flex-col bg-bg-1 font-sans text-text1"
      >
        {/* Header */}
        <GlobalHeader />
        {/* Main Content */}
        <MainContainer
          aria-label="메인 콘텐츠"
          className={`mx-auto flex flex-1 w-full max-w-6xl items-center px-4 transition-[padding-top] duration-200 ${isBannerVisible ? 'pt-10' : 'pt-4'}`}
        >
          {/* 메인 헤드라인 + 서브타이틀 / 슬로건 */}
          <div className="flex w-full flex-col items-start gap-9 pl-8">
            <LendingHeader />
            {/* CTA Section */}
            <motion.section
              aria-label="시작하기"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="relative z-10"
            >
              <DSButton
                type="button"
                onClick={() => {
                  track(LANDING_EVENTS.PROJECT_CREATE_START);
                  setIsCreateModalOpen(true);
                }}
                className="flex h-16 w-80 min-w-[11.25rem] items-center justify-center gap-[0.63rem] p-5"
                aria-label="무료로 프로젝트 생성 시작하기"
              >
                무료로 시작하기
              </DSButton>
            </motion.section>
          </div>
          {isCreateModalOpen && (
            <ProjectCreateForm onClick={() => setIsCreateModalOpen(false)} />
          )}
        </MainContainer>
        <Footer />
      </Container>
      <BetaNoticePopup />
    </GridBackground.Root>
  );
};
