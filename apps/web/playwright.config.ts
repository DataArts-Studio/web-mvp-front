import { defineConfig, devices } from '@playwright/test';

// CI 환경 감지 (GitHub Actions 등에서 자동 세팅됨)
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e',
  // e2e/ 하위 .spec.* 만 Playwright 가 잡는다.
  // vitest 와의 충돌은 확장자가 아니라 경로로 분리: vitest 는 src/**/*.test.* 만 수집하고
  // e2e/** 를 exclude 한다. (vitest.config.ts 참고)
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
    // 환경변수로 오버라이드 가능 (e.g. staging URL 로 e2e 돌리기)
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',

    // 실패 시 디버깅 자료
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: isCI ? 'retain-on-failure' : 'off',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // 다른 브라우저 추가 시 여기에 추가
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit',  use: { ...devices['Desktop Safari'] } },
  ],

  // 핵심: spec 실행 전에 Next.js 서버를 자동 기동.
  // - 로컬: 이미 띄워둔 dev 가 있으면 그대로 재사용 (reuseExistingServer)
  // - CI:   항상 새로 띄우고 종료까지 책임 짐
  //
  // CI 에서 production build 의 정확도가 필요하면 command 를
  //   "pnpm --filter web build && pnpm --filter web start"
  // 로 바꾸는 것을 권장. 다만 build 시간이 추가됨.
  webServer: {
    command: 'pnpm --filter web dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !isCI,
    timeout: 120_000, // dev 서버 첫 기동까지 여유
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
