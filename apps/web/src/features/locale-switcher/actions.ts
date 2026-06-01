'use server';

import { hasLocale } from 'next-intl';
import { cookies } from 'next/headers';

import { LOCALE_COOKIE, routing } from '@/i18n/routing';

const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

/**
 * 제품 화면의 로케일을 쿠키에 저장한다. URL 접두가 없는 제품 영역은 이 쿠키로 언어를 정한다.
 * 호출 후 클라이언트에서 `router.refresh()` 로 SSR 을 재실행해야 새 로케일이 반영된다.
 */
export async function setLocaleCookie(locale: string): Promise<void> {
  if (!hasLocale(routing.locales, locale)) {
    return;
  }
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    maxAge: ONE_YEAR_SECONDS,
    path: '/',
    sameSite: 'lax',
    httpOnly: false, // 클라이언트에서도 현재 로케일을 읽을 수 있어야 한다 (민감정보 아님).
    secure: process.env.NODE_ENV === 'production',
  });
}
