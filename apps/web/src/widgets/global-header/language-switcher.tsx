'use client';

import React from 'react';

import { useLocale, useTranslations } from 'next-intl';

import { usePathname, useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { routing } from '@/i18n/routing';

const LOCALE_LABEL_KEY: Record<Locale, 'langKo' | 'langEn'> = {
  ko: 'langKo',
  en: 'langEn',
};

/**
 * 마케팅 헤더용 언어 전환 스위처.
 *
 * 현재 경로(로케일 제거된 pathname)를 유지한 채 로케일만 바꾼다. next-intl navigation
 * 래퍼의 `useRouter().replace(pathname, { locale })` 패턴을 사용하므로 `/en` 접두 부여/제거가
 * 자동으로 처리된다. GlobalHeader 는 마케팅 화면(로케일 라우팅 대상)에서만 렌더되므로 안전하다.
 */
export const LanguageSwitcher = () => {
  const t = useTranslations('header');
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  const switchLocale = (next: Locale) => {
    if (next === locale) return;
    router.replace(pathname, { locale: next });
  };

  return (
    <div
      role="group"
      aria-label={t('langSwitcher')}
      className="text-body2 text-text-2 flex items-center gap-1"
    >
      {routing.locales.map((option, index) => {
        const isActive = option === locale;
        return (
          <React.Fragment key={option}>
            {index > 0 && (
              <span aria-hidden className="text-text-2/40">
                /
              </span>
            )}
            <button
              type="button"
              onClick={() => switchLocale(option)}
              aria-label={t(LOCALE_LABEL_KEY[option])}
              aria-current={isActive ? 'true' : undefined}
              className={`cursor-pointer transition-colors ${
                isActive ? 'text-primary font-semibold' : 'text-text-2 hover:text-primary'
              }`}
            >
              {t(LOCALE_LABEL_KEY[option])}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
};
