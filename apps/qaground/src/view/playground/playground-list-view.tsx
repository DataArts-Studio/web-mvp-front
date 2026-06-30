import Link from 'next/link';

import { PlaygroundHeader } from '@/view/challenges/playground-header';

const ENVIRONMENTS = [
  { label: 'API Sandbox', count: 2, active: true },
  { label: 'Web UI Sandbox', count: 2, active: false },
  { label: 'Auth Flow', count: 1, active: false },
  { label: 'Data Table', count: 1, active: false },
  { label: 'File Upload', count: 1, active: false },
  { label: 'Webhook', count: 1, active: false },
  { label: 'Performance Lab', count: 1, active: false },
  { label: 'Accessibility Lab', count: 1, active: false },
  { label: 'Debug Lab', count: 1, active: false },
];

const PLAYGROUNDS = [
  {
    slug: 'postman-v1',
    title: 'Postman 형식 API Sandbox v1',
    subtitle: '로그인·상품·상태 코드 API를 자유롭게 호출해보는 환경',
    version: 'v1',
    environment: 'API Sandbox',
    status: '사용 가능',
    href: '/playground/postman-v1',
    summary:
      '제공된 qaground 데모 API를 대상으로 Postman처럼 요청을 구성하고 응답을 관찰합니다. 정답 제출이나 채점 없이, 헤더·본문·상태 코드·JSON 응답을 자유롭게 실험하는 공간입니다.',
    resources: ['Auth API', 'Products API', 'Status API', 'pm.test 예시'],
  },
  {
    slug: 'commerce-api-v1',
    title: 'Commerce API Sandbox',
    subtitle: '상품, 주문, 결제 웹훅을 연결해서 만져보는 API 환경',
    version: 'v1',
    environment: 'API Sandbox',
    status: '예정',
    summary: '커머스 도메인 API를 제공하고, 사용자가 직접 요청 순서와 테스트 포인트를 설계합니다.',
    resources: ['Products', 'Orders', 'Payment webhook', 'Error cases'],
  },
  {
    slug: 'login-ui-v1',
    title: 'Login UI Sandbox',
    subtitle: '로그인 폼과 인증 상태 화면을 자유롭게 자동화하는 웹 환경',
    version: 'v1',
    environment: 'Web UI Sandbox',
    status: '예정',
    summary: '브라우저에서 직접 조작 가능한 로그인 화면을 제공하고 Playwright 자동화를 실험합니다.',
    resources: ['Login form', 'Validation', 'Session state', 'Route guard'],
  },
  {
    slug: 'table-ui-v1',
    title: 'Data Table Sandbox',
    subtitle: '검색, 필터, 페이지네이션이 있는 목록 UI 환경',
    version: 'v1',
    environment: 'Data Table',
    status: '예정',
    summary:
      '테이블 UI를 제공하고 사용자가 정렬, 필터, 빈 상태, 페이지 이동을 자유롭게 검증합니다.',
    resources: ['Search', 'Filter', 'Pagination', 'Empty state'],
  },
  {
    slug: 'upload-v1',
    title: 'File Upload Sandbox',
    subtitle: '파일 업로드, 제한, 실패 응답을 실험하는 환경',
    version: 'v1',
    environment: 'File Upload',
    status: '예정',
    summary: '파일 크기, MIME 타입, 업로드 실패/성공 응답을 직접 조합해 테스트할 수 있습니다.',
    resources: ['Upload form', 'File API', 'Validation', 'Preview'],
  },
  {
    slug: 'webhook-v1',
    title: 'Webhook Sandbox',
    subtitle: '서명 헤더와 이벤트 페이로드를 바꿔보는 웹훅 환경',
    version: 'v1',
    environment: 'Webhook',
    status: '예정',
    summary: '웹훅 이벤트를 직접 보내고 서명 실패, 중복 이벤트, 잘못된 페이로드를 관찰합니다.',
    resources: ['Signature', 'Event payload', 'Retry', 'Idempotency'],
  },
  {
    slug: 'perf-page-v1',
    title: 'Performance Lab',
    subtitle: '느린 이미지, 긴 JS 작업, 레이아웃 이동이 있는 페이지',
    version: 'v1',
    environment: 'Performance Lab',
    status: '예정',
    summary:
      '의도적으로 병목이 있는 페이지를 제공하고 DevTools와 Lighthouse로 자유롭게 분석합니다.',
    resources: ['LCP case', 'CLS case', 'Long task', 'Network waterfall'],
  },
  {
    slug: 'a11y-page-v1',
    title: 'Accessibility Lab',
    subtitle: '키보드 탐색과 라벨 이슈가 섞인 화면 환경',
    version: 'v1',
    environment: 'Accessibility Lab',
    status: '예정',
    summary: '접근성 문제가 있는 UI를 제공하고 사용자가 직접 탐색, 관찰, 리포팅을 연습합니다.',
    resources: ['Focus order', 'Labels', 'Dialog', 'Contrast'],
  },
  {
    slug: 'debug-v1',
    title: 'Debug Lab',
    subtitle: '네트워크 실패와 콘솔 오류가 발생하는 디버깅 환경',
    version: 'v1',
    environment: 'Debug Lab',
    status: '예정',
    summary: '깨진 화면과 API 실패를 제공하고 원인 추적, 로그 수집, 재현 정리를 자유롭게 해봅니다.',
    resources: ['Console error', 'Network failure', 'State bug', 'Repro notes'],
  },
];

const availableCount = PLAYGROUNDS.filter((item) => item.status === '사용 가능').length;

function PlaygroundCard({ item }: { item: (typeof PLAYGROUNDS)[number] }) {
  const body = (
    <>
      <div className="border-line-2 bg-bg-3/50 border-b p-5">
        <div className="flex items-center gap-2">
          <span className="bg-primary/12 text-primary rounded-full px-2.5 py-0.5 text-xs font-medium">
            {item.environment}
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

        <div className="mt-5 flex flex-wrap gap-1.5">
          {item.resources.map((resource) => (
            <span
              key={resource}
              className="border-line-3 text-text-3 rounded-full border px-2 py-0.5 text-xs"
            >
              {resource}
            </span>
          ))}
        </div>

        <div className="border-line-2 text-text-2 group-hover:text-text-1 mt-auto flex items-center justify-between border-t pt-4 text-sm transition-colors">
          <span>{item.status === '사용 가능' ? '환경 열기' : '환경 준비중'}</span>
          <span aria-hidden>{item.href ? '→' : '예정'}</span>
        </div>
      </div>
    </>
  );

  const className =
    'group border-line-2 bg-bg-2 flex min-h-80 flex-col overflow-hidden rounded-2xl border transition-colors';

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
            <h2 className="text-sm font-semibold">제공 환경</h2>
            <nav className="mt-4 flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
              {ENVIRONMENTS.map((environment) => (
                <button
                  key={environment.label}
                  type="button"
                  disabled={!environment.active}
                  className={[
                    'flex min-w-40 items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors lg:min-w-0',
                    environment.active
                      ? 'bg-bg-3 text-text-1 font-medium'
                      : 'text-text-3 cursor-not-allowed opacity-75',
                  ].join(' ')}
                >
                  <span>{environment.label}</span>
                  <span className="text-text-3 text-xs">{environment.count}</span>
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
                  qaground가 웹사이트와 API를 제공하고, 사용자는 그 위에서 자유롭게 요청을 보내고
                  자동화하고 관찰하는 공간입니다. 정답 제출이나 채점보다, 실무처럼 시스템을 만져보며
                  테스트 아이디어를 직접 실험하는 데 초점을 둡니다.
                </p>
              </div>
              <div className="border-line-2 bg-bg-1 rounded-xl border p-4">
                <p className="text-text-3 text-xs">사용 가능 / 준비중 환경</p>
                <p className="mt-2 text-3xl font-bold">
                  {availableCount} / {PLAYGROUNDS.length}
                </p>
                <p className="text-text-2 mt-1 text-sm">
                  첫 환경은 Postman 형식 API Sandbox입니다.
                </p>
              </div>
            </div>
          </header>

          <section className="mt-8">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Sandbox Catalog</h2>
                <p className="text-text-2 mt-1 text-sm">
                  제공된 웹/API 환경을 열고 원하는 방식으로 요청, 자동화, 디버깅을 실험하세요.
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
