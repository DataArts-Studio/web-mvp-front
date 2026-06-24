import Link from 'next/link';

import { CHALLENGES, DIFFICULTY_LABEL, TRACK_LABEL } from '@/shared/challenges/registry';

import { PlaygroundHeader } from './playground-header';

export const ChallengesView = () => {
  return (
    <div className="bg-bg-1 text-text-1 flex min-h-screen flex-col font-sans">
      <PlaygroundHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6">
        <header className="mb-10 flex flex-col gap-3">
          <h1 className="text-3xl font-bold">연습 챌린지</h1>
          <p className="text-text-2 text-sm">
            연습 대상에 직접 자동화 테스트를 작성해 보세요. 로그인 없이 누구나 이용할 수 있습니다.
          </p>
        </header>

        <ul className="grid gap-4 sm:grid-cols-2">
          {CHALLENGES.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/challenges/${c.slug}`}
                className="border-line-2 bg-bg-2 hover:border-line-3 flex h-full flex-col gap-3 rounded-2xl border p-6 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="bg-bg-3 text-text-2 rounded-full px-2.5 py-1 text-xs">
                    {TRACK_LABEL[c.track]}
                  </span>
                  <span className="bg-bg-3 text-text-2 rounded-full px-2.5 py-1 text-xs">
                    {DIFFICULTY_LABEL[c.difficulty]}
                  </span>
                </div>
                <span className="text-lg font-semibold">{c.title}</span>
                <span className="text-text-2 text-sm leading-relaxed">{c.summary}</span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
};
