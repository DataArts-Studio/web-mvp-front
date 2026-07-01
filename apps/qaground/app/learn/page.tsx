import type { Metadata } from 'next';
import Link from 'next/link';

import {
  CHALLENGES,
  type ChallengeDifficulty,
  type ChallengeTrack,
} from '@/shared/challenges/registry';
import { PlaygroundHeader } from '@/view/challenges/playground-header';
import { GuideToc } from '@/view/guide/guide-toc';

const DESCRIPTION =
  'qaground 학습 경로. 자동화(Playwright)·메뉴얼(테스트 설계)·API(Postman)·성능·접근성 트랙을 난이도 순서로 따라가며 QA 실력을 단계별로 쌓는 커리큘럼입니다.';

export const metadata: Metadata = {
  title: '학습 경로',
  description: DESCRIPTION,
  alternates: { canonical: '/learn' },
  keywords: [
    'QA 학습 경로',
    'QA 커리큘럼',
    'Playwright 단계별 학습',
    'API 테스트 연습 순서',
    '테스트 케이스 설계 연습',
    '테스티아',
  ],
  openGraph: {
    title: '학습 경로 | qaground',
    description: DESCRIPTION,
    url: 'https://qaground.gettestea.com/learn',
  },
};

const DIFF_ORDER: Record<ChallengeDifficulty, number> = { easy: 0, medium: 1, hard: 2 };
const DIFF: Record<ChallengeDifficulty, { label: string; cls: string }> = {
  easy: { label: '입문', cls: 'border-[#3fb950]/40 text-[#3fb950]' },
  medium: { label: '중급', cls: 'border-[#d29922]/40 text-[#d29922]' },
  hard: { label: '심화', cls: 'border-[#f85149]/40 text-[#f85149]' },
};

const TRACKS: {
  key: ChallengeTrack;
  n: string;
  tag: string;
  bar: string;
  text: string;
  title: string;
  desc: string;
}[] = [
  {
    key: 'automation',
    n: '01',
    tag: 'AUTO',
    bar: 'bg-[#3fb950]',
    text: 'text-[#3fb950]',
    title: '자동화 · Playwright',
    desc: '실제형 화면에 Playwright UI 테스트를 작성하며 셀렉터·단언·흐름을 익힙니다.',
  },
  {
    key: 'manual',
    n: '02',
    tag: 'MANUAL',
    bar: 'bg-[#d29922]',
    text: 'text-[#d29922]',
    title: '메뉴얼 · 테스트 설계',
    desc: '요구사항을 분석해 케이스를 설계하고 결함을 리포트하는 기본기를 다집니다.',
  },
  {
    key: 'api',
    n: '03',
    tag: 'API',
    bar: 'bg-[#58a6ff]',
    text: 'text-[#58a6ff]',
    title: 'API · Postman',
    desc: '요청을 구성하고 상태 코드·응답을 단언하며 API 테스트를 연습합니다.',
  },
  {
    key: 'performance',
    n: '04',
    tag: 'PERF',
    bar: 'bg-[#a371f7]',
    text: 'text-[#a371f7]',
    title: '성능 · Web Vitals',
    desc: 'Core Web Vitals, 네트워크, 리소스 병목을 측정하고 재현 가능한 성능 리포트로 정리합니다.',
  },
  {
    key: 'accessibility',
    n: '05',
    tag: 'A11Y',
    bar: 'bg-[#f778ba]',
    text: 'text-[#f778ba]',
    title: '접근성 · Keyboard & Screen Reader',
    desc: '키보드 탐색, 포커스, 라벨, 에러 전달, 색 대비를 점검하는 접근성 테스트를 연습합니다.',
  },
];

const TOC = TRACKS.map((t) => [t.n, t.title.split(' · ')[0], t.key]);

const ordered = (track: ChallengeTrack) =>
  CHALLENGES.filter((c) => c.track === track).sort(
    (a, b) => DIFF_ORDER[a.difficulty] - DIFF_ORDER[b.difficulty]
  );

export default function LearnPage() {
  return (
    <div className="bg-bg-1 text-text-1 min-h-screen font-sans">
      <PlaygroundHeader containerClassName="max-w-5xl" />

      <div className="mx-auto flex w-full max-w-5xl gap-12 px-6 pt-14 pb-24">
        <main className="max-w-3xl min-w-0 flex-1">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">학습 경로</h1>
          <p className="text-text-2 mt-4 text-base leading-relaxed">
            트랙을 골라 입문부터 심화까지 순서대로 풀어 보세요. 처음이라면 자동화 입문(입문
            배지)부터 시작해 메뉴얼 설계, API, 성능, 접근성으로 넓혀 가는 흐름을 권장합니다.
          </p>

          <div className="mt-14 flex flex-col gap-16">
            {TRACKS.map((t) => {
              const items = ordered(t.key);
              return (
                <section
                  key={t.key}
                  id={t.key}
                  className="border-line-2 scroll-mt-20 border-t pt-12"
                >
                  <div className="flex gap-4">
                    <span className={`mt-1 w-[3px] shrink-0 self-stretch rounded-full ${t.bar}`} />
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-primary font-mono text-sm font-semibold">{t.n}</span>
                        <h2 className="text-text-1 text-2xl font-bold tracking-tight">{t.title}</h2>
                      </div>
                      <p className="text-text-2 mt-2 text-sm leading-relaxed">{t.desc}</p>
                      <p className="text-text-3 mt-1 text-xs">총 {items.length}개</p>
                    </div>
                  </div>

                  <ol className="mt-6 flex flex-col gap-3">
                    {items.map((c, i) => (
                      <li key={c.slug}>
                        <Link
                          href={`/challenges/${c.slug}`}
                          className="border-line-2 bg-bg-2 hover:border-line-3 group flex gap-4 rounded-xl border p-4 transition-colors"
                        >
                          <span className="text-text-3/60 w-6 shrink-0 pt-0.5 text-right font-mono text-sm tabular-nums">
                            {i + 1}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${DIFF[c.difficulty].cls}`}
                              >
                                {DIFF[c.difficulty].label}
                              </span>
                              <span className="text-text-3 font-mono text-[11px]">
                                {c.tools.join(' · ')}
                              </span>
                            </span>
                            <span className="text-text-1 group-hover:text-primary mt-1.5 block font-medium transition-colors">
                              {c.title}
                            </span>
                            <span className="text-text-3 mt-0.5 line-clamp-2 block text-sm leading-relaxed">
                              {c.summary}
                            </span>
                          </span>
                          <span className="text-text-3/50 group-hover:text-primary self-center text-lg transition-colors">
                            →
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                </section>
              );
            })}
          </div>

          {/* 마무리 */}
          <div className="border-line-2 mt-16 border-t pt-12">
            <h2 className="text-text-1 text-2xl font-bold tracking-tight">처음이라면</h2>
            <p className="text-text-2 mt-3 text-[15px] leading-relaxed">
              사용법·채점 방식이 궁금하면 가이드를 먼저 읽어 보세요.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/guide"
                className="border-line-3 text-text-1 hover:bg-bg-2 rounded-button inline-flex h-11 items-center justify-center border px-6 text-sm font-semibold transition-colors"
              >
                가이드 보기
              </Link>
              <Link
                href="/challenges"
                className="bg-primary rounded-button hover:bg-primary/90 inline-flex h-11 items-center justify-center px-6 text-sm font-semibold text-white transition-colors"
              >
                전체 챌린지
              </Link>
            </div>
          </div>
        </main>

        <aside className="hidden w-52 shrink-0 lg:block">
          <div className="sticky top-24">
            <GuideToc items={TOC} />
          </div>
        </aside>
      </div>
    </div>
  );
}
