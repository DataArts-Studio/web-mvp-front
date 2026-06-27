import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import {
  CHALLENGES,
  type Challenge,
  DIFFICULTY_LABEL,
  getChallenge,
} from '@/shared/challenges/registry';
import { ChallengeDetailView } from '@/view/challenges';

const SITE = 'https://qaground.gettestea.com';

export function generateStaticParams() {
  return CHALLENGES.map((c) => ({ slug: c.slug }));
}

/** meta description 는 ~155자로 잘라 검색 결과 잘림을 피한다(시나리오 챌린지는 본문이 길다). */
function metaDescription(c: Challenge): string {
  const s = c.summary.replace(/\s+/g, ' ').trim();
  if (s.length <= 155) return s;
  const cut = s.slice(0, 152);
  const lastDot = cut.lastIndexOf('. ');
  return (lastDot > 80 ? cut.slice(0, lastDot + 1) : cut.trimEnd()) + '…';
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const challenge = getChallenge(slug);
  if (!challenge) return { title: '챌린지를 찾을 수 없음' };
  const url = `${SITE}/challenges/${challenge.slug}`;
  const description = metaDescription(challenge);
  return {
    title: challenge.title,
    description,
    alternates: { canonical: `/challenges/${challenge.slug}` },
    keywords: [challenge.title, ...challenge.tools, 'QA 연습', '테스트 연습', '테스티아'],
    openGraph: {
      title: `${challenge.title} | qaground`,
      description,
      url,
      type: 'article',
    },
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

  const url = `${SITE}/challenges/${challenge.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LearningResource',
        '@id': `${url}#resource`,
        name: challenge.title,
        description: metaDescription(challenge),
        url,
        inLanguage: 'ko',
        isAccessibleForFree: true,
        learningResourceType: '실습 과제',
        educationalLevel: DIFFICULTY_LABEL[challenge.difficulty],
        teaches: challenge.tools.join(', '),
        provider: { '@type': 'Organization', name: 'Testea', url: 'https://gettestea.com' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '홈', item: SITE },
          { '@type': 'ListItem', position: 2, name: '연습 챌린지', item: `${SITE}/challenges` },
          { '@type': 'ListItem', position: 3, name: challenge.title, item: url },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ChallengeDetailView challenge={challenge} />
    </>
  );
}
