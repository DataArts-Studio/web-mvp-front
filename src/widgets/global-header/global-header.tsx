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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { isVisible: isBannerVisible, dismiss: dismissBanner } = useBetaBanner();

  return (
    <>
      <BetaBanner isVisible={isBannerVisible} onDismiss={dismissBanner} />
      <header
        role="banner"
        aria-label="글로벌 헤더"
        className={`fixed right-0 left-0 z-10 flex h-14 items-center justify-between px-4 transition-[top] duration-200 sm:h-16 sm:px-6 md:px-12 ${
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
          <Image src="/logo.svg" alt="Testea" width={100} height={24} className="sm:h-7 sm:w-[120px]" />
        </Link>

        {/* Desktop Navigation */}
        <nav aria-label="메인 네비게이션" className="hidden items-center gap-6 sm:flex">
          <Link
            href="/docs?tab=getting-started"
            aria-label="문서 페이지로 이동"
            className="text-body2 text-text-2 transition-colors hover:text-primary"
            onClick={() => track(NAVIGATION_EVENTS.DOCS_CLICK)}
          >
            이용 가이드
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

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="메뉴 열기"
          aria-expanded={isMobileMenuOpen}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-text-2 transition-colors hover:bg-bg-2 sm:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isMobileMenuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </header>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div
          className={`fixed right-0 left-0 z-10 border-b border-line-2 bg-bg-1/95 backdrop-blur-sm sm:hidden ${
            isBannerVisible ? 'top-[5.5rem]' : 'top-14'
          }`}
        >
          <nav aria-label="모바일 네비게이션" className="flex flex-col px-4 py-3">
            <Link
              href="/docs?tab=getting-started"
              className="rounded-lg px-3 py-2.5 text-sm text-text-2 transition-colors hover:bg-bg-2 hover:text-primary"
              onClick={() => {
                track(NAVIGATION_EVENTS.DOCS_CLICK);
                setIsMobileMenuOpen(false);
              }}
            >
              이용 가이드
            </Link>
            <button
              type="button"
              onClick={() => {
                track(LANDING_EVENTS.PROJECT_SEARCH_OPEN);
                setIsSearchModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="rounded-lg px-3 py-2.5 text-left text-sm text-text-2 transition-colors hover:bg-bg-2 hover:text-primary"
            >
              내 프로젝트 찾기
            </button>
          </nav>
        </div>
      )}

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
