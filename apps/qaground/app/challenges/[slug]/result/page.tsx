import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  CATEGORY_LABEL,
  CHALLENGES,
  DIFFICULTY_LABEL,
  TRACK_LABEL,
  getChallenge,
} from '@/shared/challenges/registry';
import { ChallengeSolutionCompare } from '@/view/challenges/challenge-solution-compare';
import { PlaygroundHeader } from '@/view/challenges/playground-header';

const SITE = 'https://qaground.gettestea.com';

export function generateStaticParams() {
  return CHALLENGES.map((challenge) => ({ slug: challenge.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const challenge = getChallenge(slug);
  if (!challenge) return { title: '결과를 찾을 수 없음' };

  return {
    title: `${challenge.title} 결과`,
    description: `${challenge.title} 통과 후 모범 풀이와 다음 학습 방향을 확인합니다.`,
    alternates: { canonical: `/challenges/${challenge.slug}/result` },
    robots: { index: false, follow: false },
    openGraph: {
      title: `${challenge.title} 결과 | qaground`,
      description: `${challenge.title} 통과 후 모범 풀이와 다음 학습 방향을 확인합니다.`,
      url: `${SITE}/challenges/${challenge.slug}/result`,
      type: 'article',
    },
  };
}

export default async function ChallengeResultPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const challenge = getChallenge(slug);
  if (!challenge) notFound();

  const solution = challenge.modelSolution;
  const recommendedChallenges = (challenge.recommendedNext ?? [])
    .map((nextSlug) => getChallenge(nextSlug))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <div className="bg-bg-1 text-text-1 flex min-h-screen flex-col font-sans">
      <PlaygroundHeader containerClassName="max-w-7xl" />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6">
        <Link
          href={`/challenges/${challenge.slug}`}
          className="text-text-3 hover:text-text-1 inline-flex text-sm transition-colors"
        >
          ← 문제로 돌아가기
        </Link>

        <section className="border-line-2 mt-6 border-b pb-8">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="bg-primary/15 text-primary px-2.5 py-1 font-medium">통과</span>
            <span className="bg-bg-3 text-text-2 px-2.5 py-1">{TRACK_LABEL[challenge.track]}</span>
            <span className="bg-bg-3 text-text-2 px-2.5 py-1">
              {CATEGORY_LABEL[challenge.category]}
            </span>
            <span className="bg-bg-3 text-text-2 px-2.5 py-1">
              {DIFFICULTY_LABEL[challenge.difficulty]}
            </span>
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
            {challenge.title} 결과
          </h1>
          <p className="text-text-2 mt-3 max-w-3xl text-sm leading-relaxed">
            정답 제출이 확인되었습니다. 아래에서 풀이 포인트를 확인하고, 같은 문제를 더 안정적인
            테스트로 다시 다듬어 보세요.
          </p>
        </section>

        <div className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_15rem]">
          <section className="min-w-0">
            <h2 className="text-lg font-semibold">모범 풀이 포인트</h2>
            <div className="border-line-2 bg-bg-2 mt-4 border">
              {(solution?.approach?.length ? solution.approach : challenge.requirement).map(
                (item, index) => (
                  <div key={item} className="border-line-2 border-b px-4 py-3 last:border-b-0">
                    <div className="flex gap-3">
                      <span className="text-primary mt-0.5 font-mono text-xs">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <p className="text-text-2 text-sm leading-relaxed">{item}</p>
                    </div>
                  </div>
                )
              )}
            </div>

            {solution?.code && (
              <ChallengeSolutionCompare slug={challenge.slug} solutionCode={solution.code} />
            )}

            {!!solution?.notes?.length && (
              <section className="mt-8">
                <h2 className="text-lg font-semibold">리뷰 메모</h2>
                <ul className="text-text-2 mt-3 flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed">
                  {solution.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </section>
            )}

            <section className="border-line-2 mt-8 border-t pt-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">다른 사람 풀이</h2>
                  <p className="text-text-3 mt-1 text-sm leading-relaxed">
                    추후 로그인 제출 이력을 기반으로 공개 풀이, 인기 풀이, 내 풀이 비교를
                    연결합니다.
                  </p>
                </div>
                <span className="border-line-3 text-text-3 shrink-0 border px-3 py-1 text-xs">
                  준비중
                </span>
              </div>
            </section>
          </section>

          <aside className="border-line-2 bg-bg-2 h-fit border p-4">
            <h2 className="text-sm font-semibold">다음 행동</h2>
            <div className="mt-4 flex flex-col gap-2">
              <Link
                href={`/challenges/${challenge.slug}`}
                className="border-line-3 text-text-1 hover:bg-bg-3 inline-flex h-10 items-center justify-center border px-4 text-sm transition-colors"
              >
                다시 풀기
              </Link>
              <Link
                href="/challenges"
                className="bg-primary hover:bg-primary/90 inline-flex h-10 items-center justify-center px-4 text-sm font-medium text-white transition-colors"
              >
                다른 챌린지 풀기
              </Link>
            </div>

            {recommendedChallenges.length > 0 && (
              <section className="border-line-2 mt-5 border-t pt-5">
                <h2 className="text-sm font-semibold">추천 문제</h2>
                <div className="mt-3 flex flex-col gap-2">
                  {recommendedChallenges.map((item) => (
                    <Link
                      key={item.slug}
                      href={`/challenges/${item.slug}`}
                      className="border-line-3 hover:bg-bg-3 block border px-3 py-2 transition-colors"
                    >
                      <span className="text-text-1 block text-sm font-medium">{item.title}</span>
                      <span className="text-text-3 mt-1 block text-xs">
                        {TRACK_LABEL[item.track]} · {DIFFICULTY_LABEL[item.difficulty]}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
