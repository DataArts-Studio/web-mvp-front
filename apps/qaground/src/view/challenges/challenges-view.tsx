import Link from 'next/link';

import {
  CATEGORY_LABEL,
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

        <section className="border-line-2 bg-bg-2 mt-16 flex flex-col items-center gap-3 rounded-2xl border px-6 py-10 text-center">
          <p className="text-text-3 text-sm">여기서 연습한 테스트, 실무에선 어떻게 관리하시나요?</p>
          <h2 className="text-xl font-semibold">
            테스트 케이스·실행·리포트는 <span className="text-primary">Testea</span>로
          </h2>
          <a
            href="https://gettestea.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 rounded-lg bg-[#0bb57f] px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Testea 둘러보기
          </a>
        </section>
      </main>
    </div>
  );
};
