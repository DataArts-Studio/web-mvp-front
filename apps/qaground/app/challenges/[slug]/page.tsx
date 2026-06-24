import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { CHALLENGES, getChallenge } from '@/shared/challenges/registry';
import { ChallengeDetailView } from '@/view/challenges';

export function generateStaticParams() {
  return CHALLENGES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const challenge = getChallenge(slug);
  if (!challenge) return { title: '챌린지를 찾을 수 없음 — qaground' };
  return {
    title: `${challenge.title} — qaground`,
    description: challenge.summary,
  };
}

export default async function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const challenge = getChallenge(slug);
  if (!challenge) notFound();
  return <ChallengeDetailView challenge={challenge} />;
}
