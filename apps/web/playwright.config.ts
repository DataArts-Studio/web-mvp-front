import { defineConfig, devices } from '@playwright/test';

// CI 환경 감지 (GitHub Actions 등에서 자동 세팅됨)
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  // tests/ 하위 .spec.* 만 Playwright 가 잡는다.
  // vitest 와의 충돌은 경로로 분리: vitest 는 src/**/*.test.* 만 수집하고
  // tests/** 를 exclude 한다. (vitest.config.ts 참고)
  testMatch: '**/*.spec.{ts,tsx}',
  // 모든 spec 의 default timeout. 어서션 보다 큰 범위 (test 함수 전체)
  timeout: 60_000,

  // CI 에선 test.only 가 남아있으면 실패 처리 (실수로 푸시되는 것 방지)
  forbidOnly: isCI,

  // CI 는 flaky 잡기 위해 재시도, 로컬은 즉시 실패 표시
  retries: isCI ? 2 : 0,

  // CI 는 워커 1로 직렬화 (resource 충돌 회피 + 로그 가독성)
  // 로컬은 undefined → Playwright 자동 결정 (CPU 절반 정도)
  workers: isCI ? 1 : undefined,

  // 로컬은 list (간결), CI 는 html 리포트로 아티팩트 업로드
  reporter: isCI ? [['list'], ['html', { open: 'never' }]] : 'list',

  use: {
    // spec 에서 page.goto('/') 만 써도 되도록 baseURL 지정
    // 환경변수로 오버라이드 가능 (e.g. staging URL 로 테스트 돌리기)
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',

    // 실패 시 디버깅 자료
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: isCI ? 'retain-on-failure' : 'off',
  },

  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    // 미인증
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: [
        '**/scenario/access/**/*.spec.ts',
        '**/scenario/project/**/*.spec.ts',
        '**/smoke/**/*.spec.ts',
        // 레거시(POM 이관 전) 미인증 플로우도 baseline 측정 대상에 포함한다.
        '**/create-project/**/*.spec.ts',
        '**/project-search/**/*.spec.ts',
      ],
    },
    // 인증 필요
    {
      name: 'chromium-auth',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/project.json',
      },
      dependencies: ['setup'],
      testMatch: ['**/scenario/dashboard/**/*.spec.ts', '**/scenario/testcase/**/*.spec.ts'],
    },
    // 다른 브라우저 추가 시 여기에 추가
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit',  use: { ...devices['Desktop Safari'] } },
  ],

  // 핵심: spec 실행 전에 Next.js 서버를 자동 기동.
  // - 로컬: 이미 띄워둔 dev 가 있으면 그대로 재사용 (reuseExistingServer)
  // - CI:   운영 빌드(build + start)로 띄운다. dev 서버는 라우트를 처음 열 때마다 컴파일해
  //         (대시보드 첫 요청 40초, 서버 액션 20초대) 5초 단언·60초 테스트 제한을 넘기는
  //         거짓 실패를 만들었다. 운영 빌드는 실제 배포와 같은 동작을 검증한다는 장점도 있다.
  webServer: {
    command: isCI ? 'pnpm --filter web build && pnpm --filter web start' : 'pnpm --filter web dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !isCI,
    // CI 는 빌드 시간을 포함하므로 넉넉히 둔다.
    timeout: isCI ? 600_000 : 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
