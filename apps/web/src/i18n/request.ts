import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';

import { routing } from './routing';

/**
 * 요청별 로케일·메시지 해석.
 *
 * [locale] 세그먼트 밖의 라우트(제품 `/projects`, `/share`, `/api` 등)는 유효 로케일이
 * 아니므로 `hasLocale` 가 실패하고 defaultLocale(ko) 로 폴백한다. 따라서 제품 화면은
 * 항상 ko 메시지·`lang="ko"` 로 동작해 회귀가 없다.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
