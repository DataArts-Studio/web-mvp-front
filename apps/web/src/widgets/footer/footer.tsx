import React from 'react';

import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';

export const Footer = () => {
  const t = useTranslations('footer');
  // 렌더 시점에 계산해 장수 프로세스에서도 연도가 갱신되도록 한다.
  const currentYear = new Date().getFullYear();

  return (
    <footer
      role="contentinfo"
      aria-label={t('ariaInfo')}
      className="bg-bg-1 w-full border-t border-neutral-800 py-4 text-center text-xs text-neutral-500"
    >
      <span aria-label={t('ariaCopyright')}>{t('copyright', { year: currentYear })}</span>
      <span aria-hidden="true" className="mx-2">
        {' '}
        |{' '}
      </span>
      <nav aria-label={t('ariaLinks')} className="inline">
        <Link href="/legal?tab=privacy" aria-label={t('privacy')} className="hover:text-teal-400">
          {t('privacy')}
        </Link>
        <span aria-hidden="true" className="mx-2">
          {' '}
          |{' '}
        </span>
        <Link href="/legal?tab=terms" aria-label={t('terms')} className="hover:text-teal-400">
          {t('terms')}
        </Link>
        <span aria-hidden="true" className="mx-2">
          {' '}
          |{' '}
        </span>
        <Link href="/team" aria-label={t('teamAria')} className="hover:text-teal-400">
          {t('team')}
        </Link>
      </nav>
    </footer>
  );
};
