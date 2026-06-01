import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

import { LOCALE_COOKIE, routing } from './routing';

/**
 * 요청별 로케일·메시지 해석.
 *
 * 우선순위: (1) URL 세그먼트 로케일(마케팅 `[locale]`) → (2) `NEXT_LOCALE` 쿠키(제품 화면) →
 * (3) defaultLocale(ko). 마케팅은 URL 접두가 항상 우선이라 쿠키와 충돌하지 않고, [locale]
 * 밖의 제품(`/projects` 등)은 URL 로케일이 없어 쿠키로 언어를 정한다(쿠키 없으면 ko).
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  let locale = hasLocale(routing.locales, requested) ? requested : undefined;

  if (!locale) {
    const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
    locale = hasLocale(routing.locales, cookieLocale) ? cookieLocale : routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
