import React from 'react';

import { getTranslations } from 'next-intl/server';
import Image from 'next/image';

import { Link } from '@/i18n/navigation';

/** 랜딩 전용 푸터. 다른 페이지는 공용 Footer 를 그대로 쓴다. */
export const LandingFooter = async () => {
  const t = await getTranslations('footer');
  const tLanding = await getTranslations('lending.footer');
  const currentYear = new Date().getFullYear();
  const linkClass = 'text-text-2 hover:text-primary transition-colors';

  return (
    <footer
      role="contentinfo"
      aria-label={t('ariaInfo')}
      className="relative mx-auto w-full max-w-[1200px] border-t border-white/10 px-4 pt-12 pb-10 md:px-0"
    >
      <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-3">
          <Image src="/logo.svg" alt="Testea" width={96} height={22} />
          <p className="text-text-3 text-sm">{tLanding('tagline')}</p>
        </div>
        <nav aria-label={t('ariaLinks')}>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <li>
              <Link href="/team" aria-label={t('teamAria')} className={linkClass}>
                {t('team')}
              </Link>
            </li>
            <li>
              <a
                href="https://qaground.gettestea.com"
                target="_blank"
                rel="noopener"
                aria-label={t('qagroundAria')}
                className={linkClass}
              >
                {t('qaground')}
              </a>
            </li>
            <li>
              <Link href="/legal?tab=terms" className={linkClass}>
                {t('terms')}
              </Link>
            </li>
            <li>
              <Link href="/legal?tab=privacy" className={linkClass}>
                {t('privacy')}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="text-text-4 mt-10 flex flex-col gap-2 border-t border-white/5 pt-6 text-xs md:flex-row md:justify-between">
        <span aria-label={t('ariaCopyright')}>{t('copyright', { year: currentYear })}</span>
        <span aria-hidden="true">{tLanding('end')}</span>
      </div>
    </footer>
  );
};
