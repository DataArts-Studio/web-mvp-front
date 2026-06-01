import type { Metadata } from 'next';

import { buildLocaleMetadata } from '@/i18n/metadata';
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
  return buildLocaleMetadata({ locale, namespace: 'meta.team', path: '/team' });
}
