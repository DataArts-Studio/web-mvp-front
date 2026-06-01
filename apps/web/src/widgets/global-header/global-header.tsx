'use client';

import React from 'react';

import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import Image from 'next/image';

import { Link } from '@/i18n/navigation';
import { LANDING_EVENTS, NAVIGATION_EVENTS, track } from '@/shared/lib/analytics';
import { NotificationBell } from '@/widgets/notification-center';

import { BetaBanner } from './beta-banner';
import { useBetaBanner } from './use-beta-banner';

const ProjectSearchModal = dynamic(
  () =>
    import('@/features/project-search/ui/project-search-modal').then((mod) => ({
      default: mod.ProjectSearchModal,
    })),
  { ssr: false }
);

export const GlobalHeader = () => {
  const t = useTranslations('header');
  const [isSearchModalOpen, setIsSearchModalOpen] = React.useState(false);
  const { isVisible: isBannerVisible, dismiss: dismissBanner } = useBetaBanner();

  return (
    <>
      <BetaBanner isVisible={isBannerVisible} onDismiss={dismissBanner} />
      <header
        role="banner"
        aria-label={t('ariaBanner')}
        className={`fixed right-0 left-0 z-10 flex h-16 items-center justify-between px-12 transition-[top] duration-200 ${
          isBannerVisible ? 'top-10' : 'top-0'
        }`}
      >
        {/* Logo */}
        <Link
          href="/"
          aria-label={t('logoAria')}
          className="flex items-center space-x-2 text-xl font-bold text-teal-400"
          onClick={() => track(NAVIGATION_EVENTS.LOGO_CLICK)}
        >
          <Image src="/logo.svg" alt={t('logoAlt')} width={120} height={28} />
        </Link>

        {/* Navigation */}
        <nav aria-label={t('navAria')} className="flex items-center gap-6">
          <Link
            href="/docs?tab=getting-started"
            aria-label={t('docsLinkAria')}
            className="text-body2 text-text-2 hover:text-primary transition-colors"
            onClick={() => track(NAVIGATION_EVENTS.DOCS_CLICK)}
          >
            {t('docs')}
          </Link>
          <button
            type="button"
            onClick={() => {
              track(LANDING_EVENTS.PROJECT_SEARCH_OPEN);
              setIsSearchModalOpen(true);
            }}
            aria-label={t('searchAria')}
            aria-haspopup="dialog"
            className="text-body2 text-text-2 hover:text-primary cursor-pointer transition-colors"
          >
            {t('findProject')}
          </button>
          <NotificationBell />
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
