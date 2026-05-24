/**
 * e2e/fixtures/test.ts
 *
 * 이 프로젝트 e2e 의 "확장 test" 진입점. (Playwright fixtures)
 *
 * 무엇
 * - 기본 `@playwright/test` 의 `test` 를 확장해 (1) 공통 셋업과
 *   (2) 도메인별 Page Object 를 fixture 로 주입한다.
 *
 * 어떻게 쓰나
 * - 스펙은 `@playwright/test` 가 아니라 **이 파일**에서 `test`, `expect` 를 import 한다.
 *     `import { test, expect } from '../../fixtures/test';`
 * - 그러면 콜백 인자로 `accessPage`, `dashboardPage` 를 바로 받을 수 있다.
 *     `test('...', async ({ accessPage }) => { ... })`
 *
 * 제공 fixture
 * - page         : 공지 dialog 사전 무력화가 적용된 Playwright Page (오버라이드)
 * - accessPage   : 인증 게이트 `/projects/{slug}/access` POM (도메인 access)
 * - dashboardPage: 대시보드 `/projects/{slug}` POM (도메인 project)
 */
import { test as base, expect } from '@playwright/test';

import { ProjectAccessPage, ProjectDashboardPage } from '../pages';
import { LandingPage } from '../pages/landing/landing.page';
import { ProjectTestcasePage } from '../pages/project/project-testcase.page';
import { ProjectTestsuitePage } from '../pages/project/project-testsuite.page';

/**
 * 베타/DB 장애 안내 dialog 의 sessionStorage dismiss 플래그.
 * 두 dialog 가 동시에 뜨면 overlay 가 겹쳐 클릭이 막히므로
 * hydration 전에 플래그를 박아 아예 안 뜨게 한다.
 */
const NOTICE_DISMISS_KEYS = [
  'beta-notice-dismissed-v1',
  'db-outage-notice-dismissed-v1',
];

type PomFixtures = {
  accessPage: ProjectAccessPage;
  dashboardPage: ProjectDashboardPage;
  testCasePage: ProjectTestcasePage;
  testSuitePage: ProjectTestsuitePage;
  landingPage: LandingPage;
};

/**
 * POM 주입 + 공통 셋업을 담은 확장 test.
 *
 * 권장: 스펙은 POM 을 직접 `new` 하지 않고 fixture 로 주입받는다.
 * - `page` 를 오버라이드해 모든 테스트에서 공지 dialog 를 사전 무력화한다.
 *   (네비게이션은 각 테스트가 명시적으로 수행 — 전역 goto 강제 없음)
 * - 도메인별 Page Object 를 페이지 단위로 lazy 주입한다.
 */
export const test = base.extend<PomFixtures>({
  // page (오버라이드): 기본 page fixture 를 감싸, 첫 네비게이션 전에
  // 공지 dismiss 플래그를 sessionStorage 에 심는다. 모든 테스트에 자동 적용.
  page: async ({ page }, use) => {
    await page.addInitScript((keys: string[]) => {
      for (const k of keys) sessionStorage.setItem(k, 'true');
    }, NOTICE_DISMISS_KEYS);
    await use(page);
  },

  landingPage: async ({ page }, use) => {
    await use(new LandingPage(page));
  },

  // accessPage: 인증 게이트(`/projects/{slug}/access`) Page Object.
  // 식별번호 입력·제출, 게이트/리다이렉트/에러/rate-limit 단언 담당.
  accessPage: async ({ page }, use) => {
    await use(new ProjectAccessPage(page));
  },

  // dashboardPage: 인증 통과 후 도착지인 대시보드(`/projects/{slug}`) Page Object.
  // 대시보드 로드·프로젝트명·KPI·사이드바 노출 단언 담당.
  dashboardPage: async ({ page }, use) => {
    await use(new ProjectDashboardPage(page));
  },

  // ProjectTestcasePage: 프로젝트 내 테스트케이스 관리 페이지
  testCasePage: async ({ page }, use) => {
    await use(new ProjectTestcasePage(page));
  },

  // ProjectTestsuitePage: 프로젝트 내 테스트 스위트 관리 페이지
  testSuitePage: async ({ page }, use) => {
    await use(new ProjectTestsuitePage(page));
  },
});

export { expect };
