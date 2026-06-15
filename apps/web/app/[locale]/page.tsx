import React from 'react';

import type { Metadata } from 'next';

import { buildLocaleMetadata } from '@/i18n/metadata';
import { LendingView } from '@/view/lending';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildLocaleMetadata({ locale, namespace: 'meta.landing', path: '/' });
}

const LendingRoute = () => {
  return <LendingView />;
};

export default LendingRoute;
