'use client';

import React, { useTransition } from 'react';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import type { Locale } from '@/i18n/routing';
import { routing } from '@/i18n/routing';

import { setLocaleCookie } from './actions';

const LOCALE_LABEL_KEY: Record<Locale, 'langKo' | 'langEn'> = {
  ko: 'langKo',
  en: 'langEn',
};

/**
 * 제품 화면용 언어 스위처. URL 접두가 없는 제품 영역은 쿠키로 로케일을 정하므로,
 * 마케팅 스위처와 달리 라우터 navigation 대신 쿠키 set + `router.refresh()` 로 전환한다.
 */
export const ProductLanguageSwitcher = () => {
  const t = useTranslations('header');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const switchLocale = (next: Locale) => {
    if (next === locale || isPending) return;
    startTransition(async () => {
      await setLocaleCookie(next);
      router.refresh();
    });
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
              disabled={isPending}
              aria-label={t(LOCALE_LABEL_KEY[option])}
              aria-current={isActive ? 'true' : undefined}
              className={`cursor-pointer transition-colors disabled:opacity-60 ${
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
