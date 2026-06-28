import Link from 'next/link';

import {
  CATEGORY_LABEL,
  CHALLENGES,
  type Challenge,
  type ChallengeCategory,
  type ChallengeDifficulty,
  DIFFICULTY_LABEL,
  TRACK_LABEL,
  challengesByCategory,
} from '@/shared/challenges/registry';

import { PlaygroundHeader } from './playground-header';

/** 난이도별 배지 색 (한눈에 스캔되도록). 다크 테마용 톤. */
const DIFFICULTY_BADGE: Record<ChallengeDifficulty, string> = {
  easy: 'bg-[#3fb950]/12 text-[#3fb950]',
  medium: 'bg-[#d29922]/12 text-[#d29922]',
  hard: 'bg-[#f85149]/12 text-[#f85149]',
};

function ChallengeCard({ challenge }: { challenge: Challenge }) {
  return (
    <Link
      href={`/challenges/${challenge.slug}`}
      className="group border-line-2 bg-bg-2 hover:border-line-3 hover:bg-bg-3/40 flex h-full flex-col gap-3 rounded-2xl border p-5 transition-colors"
    >
      <div className="flex items-center gap-2">
        <span className="bg-bg-3 text-text-2 rounded-full px-2.5 py-0.5 text-xs">
          {TRACK_LABEL[challenge.track]}
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${DIFFICULTY_BADGE[challenge.difficulty]}`}
        >
          {DIFFICULTY_LABEL[challenge.difficulty]}
        </span>
        <span
          aria-hidden
          className="text-text-3 group-hover:text-text-1 ml-auto translate-x-0 text-sm transition-all group-hover:translate-x-0.5"
        >
          →
        </span>
      </div>
      <h3 className="leading-snug font-semibold">{challenge.title}</h3>
      <p className="text-text-2 line-clamp-3 flex-1 text-sm leading-relaxed">{challenge.summary}</p>
      <div className="border-line-2 mt-1 flex items-center justify-between gap-2 border-t pt-3">
        <div className="flex min-w-0 flex-wrap gap-1.5">
          {challenge.tools.slice(0, 3).map((t) => (
            <span key={t} className="bg-bg-3 text-text-3 rounded px-1.5 py-0.5 text-[11px]">
              {t}
            </span>
          ))}
        </div>
        <span className="text-text-3 shrink-0 text-xs">
          요구사항 {challenge.requirement.length}개
        </span>
      </div>
    </Link>
  );
}

type Selected = ChallengeCategory | 'api' | 'all';

/**
 * 선택 카테고리는 쿼리스트링(`?category=`)으로 받는다. 필터된 화면을 그대로
 * 링크로 공유·북마크할 수 있고, 아사이드 항목은 실제 링크라 새 탭·복사가 된다.
 */
export const ChallengesView = ({ selectedCategory }: { selectedCategory?: string }) => {
  const groups = challengesByCategory();
  const visibleCategoryGroups = groups.filter((g) => g.category !== 'data');
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  const apiChallenges = CHALLENGES.filter((c) => c.track === 'api');

  const isCategory = visibleCategoryGroups.some((g) => g.category === selectedCategory);
  const selected: Selected =
    selectedCategory === 'api'
      ? 'api'
      : isCategory
        ? (selectedCategory as ChallengeCategory)
        : 'all';
  const visible =
    selected === 'all'
      ? groups.map((g) => ({ key: g.category, label: CATEGORY_LABEL[g.category], items: g.items }))
      : selected === 'api'
        ? [{ key: 'api', label: 'API', items: apiChallenges }]
        : groups
            .filter((g) => g.category === selected)
            .map((g) => ({ key: g.category, label: CATEGORY_LABEL[g.category], items: g.items }));

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
              {navItem('api', 'API', apiChallenges.length)}
              {visibleCategoryGroups.map((g) =>
                navItem(g.category, CATEGORY_LABEL[g.category], g.items.length)
              )}
            </nav>
          </aside>

          <div className="flex flex-1 flex-col gap-12">
            {visible.map((group) => (
              <section key={group.key}>
                <h2 className="mb-4 flex items-baseline gap-2 text-lg font-semibold">
                  {group.label}
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

        <section className="border-line-2 bg-bg-2 relative mt-16 overflow-hidden rounded-2xl border px-6 py-8 sm:px-10">
          <div
            aria-hidden
            className="bg-primary/15 pointer-events-none absolute -top-20 -right-20 h-52 w-52 rounded-full blur-3xl"
          />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <span className="text-primary text-xs font-semibold">실무 QA 도구 · 무료</span>
              <h2 className="mt-2 text-xl font-bold sm:text-2xl">
                여기서 연습한 테스트, 실무에선 <span className="text-primary">Testea</span>로
              </h2>
              <p className="text-text-2 mt-2 text-sm leading-relaxed">
                테스트 케이스·실행·리포트·마일스톤을 한 곳에서. AI가 요구사항으로
                시나리오·케이스까지 만들어 줍니다.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {['테스트 케이스 관리', 'AI 시나리오 생성', '실행 추적', '리포트'].map((c) => (
                  <span
                    key={c}
                    className="border-line-3 text-text-3 rounded-full border px-2 py-0.5 text-xs"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
            <a
              href="https://gettestea.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary rounded-button h-button-md hover:bg-primary/90 active:bg-primary/80 inline-flex shrink-0 items-center justify-center px-6 text-sm font-semibold whitespace-nowrap text-white transition-colors"
            >
              Testea 무료로 시작하기 →
            </a>
          </div>
        </section>
      </main>
    </div>
  );
};
