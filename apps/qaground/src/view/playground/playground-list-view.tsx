import Link from 'next/link';

import { PlaygroundHeader } from '@/view/challenges/playground-header';

const TRACKS = [
  { label: 'API', active: true },
  { label: 'Automation', active: false },
  { label: 'Manual QA', active: false },
  { label: 'Performance', active: false },
  { label: 'Accessibility', active: false },
];

const PLAYGROUNDS = [
  {
    slug: 'postman-v1',
    title: 'Postman 형식 v1',
    subtitle: 'API 요청과 pm.test 검증의 기본 흐름',
    version: 'v1',
    track: 'API',
    level: '입문',
    status: '사용 가능',
    progress: 0,
    modules: 4,
    href: '/playground/postman-v1',
    summary:
      '로그인 API를 대상으로 메서드, URL, 헤더, JSON 본문을 구성하고 상태 코드와 응답 필드를 검증합니다.',
    lessons: ['Request 구성', 'Response 확인', 'pm.test 작성', 'API 챌린지 연결'],
  },
];

export const PlaygroundListView = () => {
  return (
    <div className="bg-bg-1 text-text-1 flex min-h-screen flex-col font-sans">
      <PlaygroundHeader />
      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[260px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="border-line-2 bg-bg-2 rounded-2xl border p-4">
            <h2 className="text-sm font-semibold">Explore</h2>
            <nav className="mt-4 flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
              {TRACKS.map((track) => (
                <button
                  key={track.label}
                  type="button"
                  disabled={!track.active}
                  className={[
                    'flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors',
                    track.active
                      ? 'bg-bg-3 text-text-1 font-medium'
                      : 'text-text-3 cursor-not-allowed opacity-60',
                  ].join(' ')}
                >
                  <span>{track.label}</span>
                  {!track.active ? <span className="text-xs">준비중</span> : null}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="border-line-2 bg-bg-2 overflow-hidden rounded-2xl border">
            <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_280px] lg:items-end">
              <div>
                <span className="text-primary text-xs font-semibold tracking-[0.18em] uppercase">
                  qaground Playground
                </span>
                <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                  플레이그라운드
                </h1>
                <p className="text-text-2 mt-4 max-w-2xl text-sm leading-relaxed">
                  챌린지 풀이 전에 도구별 형식과 검증 루틴을 익히는 탐색 공간입니다. LeetCode
                  Explore처럼 주제별 카드에서 학습 흐름을 고르고, 각 카드 안에서 작은 모듈을
                  순서대로 확인합니다.
                </p>
              </div>
              <div className="border-line-2 bg-bg-1 rounded-xl border p-4">
                <p className="text-text-3 text-xs">현재 공개된 플레이그라운드</p>
                <p className="mt-2 text-3xl font-bold">{PLAYGROUNDS.length}</p>
                <p className="text-text-2 mt-1 text-sm">첫 버전은 Postman 형식 API 테스트입니다.</p>
              </div>
            </div>
          </header>

          <section className="mt-8">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">API Playground</h2>
                <p className="text-text-2 mt-1 text-sm">
                  요청 작성부터 검증 스크립트까지 순서대로 연습합니다.
                </p>
              </div>
              <span className="text-text-3 text-sm">{PLAYGROUNDS.length}개</span>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {PLAYGROUNDS.map((item) => (
                <Link
                  key={item.slug}
                  href={item.href}
                  className="group border-line-2 bg-bg-2 hover:border-line-3 hover:bg-bg-3/40 flex min-h-96 flex-col overflow-hidden rounded-2xl border transition-colors"
                >
                  <div className="border-line-2 bg-bg-3/50 border-b p-5">
                    <div className="flex items-center gap-2">
                      <span className="bg-primary/12 text-primary rounded-full px-2.5 py-0.5 text-xs font-medium">
                        {item.track}
                      </span>
                      <span className="bg-bg-1 text-text-2 rounded-full px-2.5 py-0.5 text-xs">
                        {item.version}
                      </span>
                      <span className="text-text-3 ml-auto text-xs">{item.status}</span>
                    </div>
                    <h3 className="mt-5 text-xl font-semibold tracking-tight">{item.title}</h3>
                    <p className="text-text-2 mt-2 text-sm leading-relaxed">{item.subtitle}</p>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-text-2 text-sm leading-relaxed">{item.summary}</p>

                    <div className="mt-5 space-y-2">
                      {item.lessons.map((lesson, index) => (
                        <div key={lesson} className="flex items-center gap-3 text-sm">
                          <span className="bg-bg-3 text-text-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs">
                            {index + 1}
                          </span>
                          <span>{lesson}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-auto pt-6">
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="text-text-3">진행률</span>
                        <span className="text-text-2">{item.progress}%</span>
                      </div>
                      <div className="bg-bg-3 h-2 overflow-hidden rounded-full">
                        <div className="bg-primary h-full" style={{ width: `${item.progress}%` }} />
                      </div>
                      <div className="border-line-2 text-text-2 group-hover:text-text-1 mt-5 flex items-center justify-between border-t pt-4 text-sm transition-colors">
                        <span>
                          {item.modules}개 모듈 · {item.level}
                        </span>
                        <span aria-hidden>→</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
