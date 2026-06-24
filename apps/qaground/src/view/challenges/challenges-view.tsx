import Link from 'next/link';

import {
  CATEGORY_LABEL,
  type Challenge,
  DIFFICULTY_LABEL,
  TRACK_LABEL,
  challengesByCategory,
} from '@/shared/challenges/registry';

import { PlaygroundHeader } from './playground-header';

function ChallengeCard({ challenge }: { challenge: Challenge }) {
  return (
    <Link
      href={`/challenges/${challenge.slug}`}
      className="border-line-2 bg-bg-2 hover:border-line-3 flex h-full flex-col gap-3 rounded-2xl border p-6 transition-colors"
    >
      <div className="flex items-center gap-2">
        <span className="bg-bg-3 text-text-2 rounded-full px-2.5 py-1 text-xs">
          {TRACK_LABEL[challenge.track]}
        </span>
        <span className="bg-bg-3 text-text-2 rounded-full px-2.5 py-1 text-xs">
          {DIFFICULTY_LABEL[challenge.difficulty]}
        </span>
      </div>
      <span className="text-lg font-semibold">{challenge.title}</span>
      <span className="text-text-2 text-sm leading-relaxed">{challenge.summary}</span>
    </Link>
  );
}

export const ChallengesView = () => {
  const groups = challengesByCategory();

  return (
    <div className="bg-bg-1 text-text-1 flex min-h-screen flex-col font-sans">
      <PlaygroundHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6">
        <header className="mb-12 flex flex-col gap-3">
          <h1 className="text-3xl font-bold">연습 챌린지</h1>
          <p className="text-text-2 text-sm">
            연습 대상에 직접 자동화 테스트를 작성해 보세요. 로그인 없이 누구나 이용할 수 있습니다.
          </p>
        </header>

        <div className="flex flex-col gap-12">
          {groups.map((group) => (
            <section key={group.category}>
              <h2 className="mb-4 flex items-baseline gap-2 text-lg font-semibold">
                {CATEGORY_LABEL[group.category]}
                <span className="text-text-3 text-sm font-normal">{group.items.length}</span>
              </h2>
              <ul className="grid gap-4 sm:grid-cols-2">
                {group.items.map((c) => (
                  <li key={c.slug}>
                    <ChallengeCard challenge={c} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
};
