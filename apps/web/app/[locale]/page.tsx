import React from 'react';

import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { LendingView } from '@/view/lending';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.landing' });

  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: locale === 'ko' ? '/' : '/en',
      languages: {
        'ko-KR': '/',
        'en-US': '/en',
        'x-default': '/',
      },
    },
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      locale: locale === 'ko' ? 'ko_KR' : 'en_US',
    },
  };
}

const LendingRoute = () => {
  return <LendingView />;
};

export default LendingRoute;
