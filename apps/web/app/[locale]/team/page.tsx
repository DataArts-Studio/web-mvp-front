import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { TeamView } from '@/view/team';

export default function TeamPage() {
  return <TeamView />;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.team' });

  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: locale === 'ko' ? '/team' : '/en/team',
      languages: {
        'ko-KR': '/team',
        'en-US': '/en/team',
        'x-default': '/team',
      },
    },
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      locale: locale === 'ko' ? 'ko_KR' : 'en_US',
    },
  };
}
