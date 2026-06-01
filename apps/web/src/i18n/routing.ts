import { defineRouting } from 'next-intl/routing';

/**
 * 로케일 라우팅 설정.
 *
 * - localePrefix: 'as-needed' → 기본 로케일(ko)은 접두사 없이 `/`, 영어는 `/en` 접두.
 * - localeDetection: false → `/` 진입 시 Accept-Language/쿠키로 `/en` 강제 리다이렉트하지
 *   않는다. 기존 한국어 URL 의 안정성과 SEO 정합을 위해 1단계에서는 명시적 진입만 허용.
 */
export const routing = defineRouting({
  locales: ['ko', 'en'],
  defaultLocale: 'ko',
  localePrefix: 'as-needed',
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
