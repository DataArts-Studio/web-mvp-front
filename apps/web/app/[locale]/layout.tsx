import type { ReactNode } from 'react';

import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { routing } from '@/i18n/routing';

/**
 * 마케팅 로케일 세그먼트 레이아웃.
 *
 * `<html>`/`<body>` 와 Provider 는 루트 `app/layout.tsx` 가 담당하므로 여기서는
 * 로케일 검증과 정적 렌더 활성화(setRequestLocale)만 한다.
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  return children;
}
