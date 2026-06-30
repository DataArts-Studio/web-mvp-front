import Link from 'next/link';

import { PlaygroundHeader } from '@/view/challenges/playground-header';

const TRACKS = [
  { label: 'API Testing', count: 2, active: true },
  { label: 'E2E Automation', count: 2, active: false },
  { label: 'Test Design', count: 2, active: false },
  { label: 'Debugging', count: 1, active: false },
  { label: 'Data & DB', count: 1, active: false },
  { label: 'Performance', count: 1, active: false },
  { label: 'Accessibility', count: 1, active: false },
  { label: 'Security Basics', count: 1, active: false },
  { label: 'CI & Reporting', count: 1, active: false },
];

const PLAYGROUNDS = [
  {
    slug: 'postman-v1',
    title: 'Postman 형식 v1',
    subtitle: 'API 요청과 pm.test 검증의 기본 흐름',
    version: 'v1',
    track: 'API Testing',
    level: '입문',
    status: '사용 가능',
    progress: 0,
    modules: 4,
    href: '/playground/postman-v1',
    summary:
      '로그인 API를 대상으로 메서드, URL, 헤더, JSON 본문을 구성하고 상태 코드와 응답 필드를 검증합니다.',
    lessons: ['Request 구성', 'Response 확인', 'pm.test 작성', 'API 챌린지 연결'],
  },
  {
    slug: 'api-contract-v1',
    title: 'API 계약 검증 v1',
    subtitle: '스키마, 에러 응답, 경계값을 검증하는 흐름',
    version: 'v1',
    track: 'API Testing',
    level: '초급',
    status: '예정',
    progress: 0,
    modules: 5,
    summary: '응답 스키마와 실패 케이스를 함께 검증해 깨지기 쉬운 API 변경을 빠르게 찾습니다.',
    lessons: ['Schema 체크', 'Error contract', 'Boundary case', 'Regression set'],
  },
  {
    slug: 'playwright-locator-v1',
    title: 'Playwright Locator v1',
    subtitle: '안정적인 셀렉터와 사용자 행동 기반 자동화',
    version: 'v1',
    track: 'E2E Automation',
    level: '입문',
    status: '예정',
    progress: 0,
    modules: 5,
    summary: 'role, label, test id를 상황에 맞게 선택하고 flaky한 CSS 셀렉터를 줄이는 연습입니다.',
    lessons: ['Role selector', 'Form action', 'Assertion', 'Flake 제거'],
  },
  {
    slug: 'test-design-v1',
    title: '테스트 설계 v1',
    subtitle: '요구사항에서 케이스와 우선순위를 뽑는 훈련',
    version: 'v1',
    track: 'Test Design',
    level: '입문',
    status: '예정',
    progress: 0,
    modules: 4,
    summary: '동등분할, 경계값, 상태 전이를 사용해 테스트 케이스를 누락 없이 구성합니다.',
    lessons: ['Requirement 분석', 'Boundary value', 'State transition', 'Priority'],
  },
  {
    slug: 'bug-report-v1',
    title: '결함 분석 리포트 v1',
    subtitle: '재현 조건과 기대/실제 결과를 분리하는 결함 작성',
    version: 'v1',
    track: 'Debugging',
    level: '초급',
    status: '예정',
    progress: 0,
    modules: 4,
    summary: '로그와 화면 단서를 바탕으로 재현 가능한 버그 리포트를 작성합니다.',
    lessons: ['Repro step', 'Evidence', 'Severity', 'Root cause hint'],
  },
  {
    slug: 'sql-validation-v1',
    title: '데이터 검증 v1',
    subtitle: 'DB 상태와 API 응답의 정합성 확인',
    version: 'v1',
    track: 'Data & DB',
    level: '초급',
    status: '예정',
    progress: 0,
    modules: 4,
    summary: '목록, 필터, 생성 결과가 저장 데이터와 일치하는지 검증하는 QA 관점을 익힙니다.',
    lessons: ['Seed data', 'Query check', 'Pagination', 'Consistency'],
  },
  {
    slug: 'web-vitals-v1',
    title: '성능 점검 v1',
    subtitle: 'Core Web Vitals와 병목 원인 분류',
    version: 'v1',
    track: 'Performance',
    level: '초급',
    status: '예정',
    progress: 0,
    modules: 4,
    summary: 'LCP, CLS, INP 지표를 읽고 재현 가능한 성능 리포트로 정리합니다.',
    lessons: ['Metric 읽기', 'Waterfall', 'Bottleneck', 'Report'],
  },
  {
    slug: 'a11y-keyboard-v1',
    title: '접근성 점검 v1',
    subtitle: '키보드 탐색과 라벨링 기본 검증',
    version: 'v1',
    track: 'Accessibility',
    level: '입문',
    status: '예정',
    progress: 0,
    modules: 4,
    summary: '폼, 모달, 메뉴에서 키보드 사용성과 스크린리더 전달 정보를 점검합니다.',
    lessons: ['Focus order', 'Label', 'Error message', 'Contrast'],
  },
  {
    slug: 'security-smoke-v1',
    title: '보안 스모크 v1',
    subtitle: '권한, 입력값, 민감정보 노출의 기본 점검',
    version: 'v1',
    track: 'Security Basics',
    level: '초급',
    status: '예정',
    progress: 0,
    modules: 4,
    summary: 'QA가 기본으로 확인해야 할 인증 우회, 권한 경계, 민감정보 노출 시나리오를 다룹니다.',
    lessons: ['Auth boundary', 'Input validation', 'Secret leak', 'Negative test'],
  },
  {
    slug: 'ci-reporting-v1',
    title: 'CI 리포팅 v1',
    subtitle: '테스트 실패를 팀이 바로 읽을 수 있게 정리',
    version: 'v1',
    track: 'CI & Reporting',
    level: '초급',
    status: '예정',
    progress: 0,
    modules: 4,
    summary: 'CI 실패 로그, 스크린샷, trace를 묶어 원인 파악 가능한 테스트 리포트를 구성합니다.',
    lessons: ['CI signal', 'Trace', 'Screenshot', 'Failure summary'],
  },
];

const availableCount = PLAYGROUNDS.filter((item) => item.status === '사용 가능').length;

function PlaygroundCard({ item }: { item: (typeof PLAYGROUNDS)[number] }) {
  const body = (
    <>
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
            <span aria-hidden>{item.href ? '→' : '예정'}</span>
          </div>
        </div>
      </div>
    </>
  );

  const className =
    'group border-line-2 bg-bg-2 flex min-h-96 flex-col overflow-hidden rounded-2xl border transition-colors';

  if (!item.href) {
    return <article className={`${className} opacity-75`}>{body}</article>;
  }

  return (
    <Link href={item.href} className={`${className} hover:border-line-3 hover:bg-bg-3/40`}>
      {body}
    </Link>
  );
}

export const PlaygroundListView = () => {
  return (
    <div className="bg-bg-1 text-text-1 flex min-h-screen flex-col font-sans">
      <PlaygroundHeader />
      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[280px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="border-line-2 bg-bg-2 rounded-2xl border p-4">
            <h2 className="text-sm font-semibold">Hard Skills</h2>
            <nav className="mt-4 flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
              {TRACKS.map((track) => (
                <button
                  key={track.label}
                  type="button"
                  disabled={!track.active}
                  className={[
                    'flex min-w-40 items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors lg:min-w-0',
                    track.active
                      ? 'bg-bg-3 text-text-1 font-medium'
                      : 'text-text-3 cursor-not-allowed opacity-75',
                  ].join(' ')}
                >
                  <span>{track.label}</span>
                  <span className="text-text-3 text-xs">{track.count}</span>
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
                  챌린지 풀이 전에 QA 하드스킬을 주제별로 익히는 탐색 공간입니다. API, 자동화,
                  테스트 설계, 데이터 검증, 성능, 접근성, 보안, CI 리포팅까지 실무 QA가 반복해서
                  쓰는 기술 흐름을 카드 단위로 확장합니다.
                </p>
              </div>
              <div className="border-line-2 bg-bg-1 rounded-xl border p-4">
                <p className="text-text-3 text-xs">공개 / 예정 플레이그라운드</p>
                <p className="mt-2 text-3xl font-bold">
                  {availableCount} / {PLAYGROUNDS.length}
                </p>
                <p className="text-text-2 mt-1 text-sm">
                  첫 공개 버전은 Postman 형식 API 테스트입니다.
                </p>
              </div>
            </div>
          </header>

          <section className="mt-8">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Hard Skill Roadmap</h2>
                <p className="text-text-2 mt-1 text-sm">
                  사용 가능한 카드부터 열고, 예정 카드는 다음 플레이그라운드 범위를 보여줍니다.
                </p>
              </div>
              <span className="text-text-3 text-sm">{PLAYGROUNDS.length}개</span>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {PLAYGROUNDS.map((item) => (
                <PlaygroundCard key={item.slug} item={item} />
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
