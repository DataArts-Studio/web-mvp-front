'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { BetaBanner } from './beta-banner';
import { useBetaBanner } from './use-beta-banner';
import { track, NAVIGATION_EVENTS, LANDING_EVENTS } from '@/shared/lib/analytics';

const ProjectSearchModal = dynamic(
  () => import('@/features/project-search/ui/project-search-modal').then(mod => ({ default: mod.ProjectSearchModal })),
  { ssr: false },
);

export const GlobalHeader = () => {
  const [isSearchModalOpen, setIsSearchModalOpen] = React.useState(false);
  const { isVisible: isBannerVisible, dismiss: dismissBanner } = useBetaBanner();

  return (
    <>
      <BetaBanner isVisible={isBannerVisible} onDismiss={dismissBanner} />
      <header
        role="banner"
        aria-label="글로벌 헤더"
        className={`fixed right-0 left-0 z-10 flex h-16 items-center justify-between px-12 transition-[top] duration-200 ${
          isBannerVisible ? 'top-10' : 'top-0'
        }`}
      >
        {/* Logo */}
        <Link
          href="/"
          aria-label="Testea 홈으로 이동"
          className="flex items-center space-x-2 text-xl font-bold text-teal-400"
          onClick={() => track(NAVIGATION_EVENTS.LOGO_CLICK)}
        >
          <Image src="/logo.svg" alt="Testea" width={120} height={28} />
        </Link>

        {/* Navigation */}
        <nav aria-label="메인 네비게이션" className="flex items-center gap-6">
          <Link
            href="/docs"
            aria-label="문서 페이지로 이동"
            className="text-body2 text-text-2 transition-colors hover:text-primary"
            onClick={() => track(NAVIGATION_EVENTS.DOCS_CLICK)}
          >
            Docs
          </Link>
          <button
            type="button"
            onClick={() => {
              track(LANDING_EVENTS.PROJECT_SEARCH_OPEN);
              setIsSearchModalOpen(true);
            }}
            aria-label="내 프로젝트 검색 모달 열기"
            aria-haspopup="dialog"
            className="text-body2 text-text-2 transition-colors hover:text-primary cursor-pointer"
          >
            내 프로젝트 찾기
          </button>
        </nav>
      </header>

      {/* Modals */}
      {isSearchModalOpen && (
        <ProjectSearchModal
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
        />
      )}
    </>
  );
};
