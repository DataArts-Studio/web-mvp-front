import Link from 'next/link';

import {
  CATEGORY_LABEL,
  type Challenge,
  type ChallengeCategory,
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

type Selected = ChallengeCategory | 'all';

/**
 * 선택 카테고리는 쿼리스트링(`?category=`)으로 받는다. 필터된 화면을 그대로
 * 링크로 공유·북마크할 수 있고, 아사이드 항목은 실제 링크라 새 탭·복사가 된다.
 */
export const ChallengesView = ({ selectedCategory }: { selectedCategory?: string }) => {
  const groups = challengesByCategory();
  const total = groups.reduce((n, g) => n + g.items.length, 0);

  const isValid = groups.some((g) => g.category === selectedCategory);
  const selected: Selected = isValid ? (selectedCategory as ChallengeCategory) : 'all';
  const visible = selected === 'all' ? groups : groups.filter((g) => g.category === selected);

  const navItem = (key: Selected, label: string, count: number) => {
    const active = selected === key;
    return (
      <Link
        key={key}
        href={key === 'all' ? '/challenges' : `/challenges?category=${key}`}
        scroll={false}
        aria-current={active ? 'true' : undefined}
        className={[
          'flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm whitespace-nowrap transition-colors',
          active ? 'bg-bg-3 text-text-1 font-medium' : 'text-text-2 hover:bg-bg-2',
        ].join(' ')}
      >
        <span>{label}</span>
        <span className="text-text-3 text-xs">{count}</span>
      </Link>
    );
  };

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

        <div className="flex flex-col gap-8 sm:flex-row sm:gap-10">
          <aside className="sm:w-44 sm:shrink-0">
            <nav className="flex gap-1 overflow-x-auto sm:sticky sm:top-24 sm:flex-col sm:overflow-visible">
              {navItem('all', '전체', total)}
              {groups.map((g) => navItem(g.category, CATEGORY_LABEL[g.category], g.items.length))}
            </nav>
          </aside>

          <div className="flex flex-1 flex-col gap-12">
            {visible.map((group) => (
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
        </div>
      </main>
    </div>
  );
};
