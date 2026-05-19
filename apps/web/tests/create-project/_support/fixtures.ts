// Playwright 의 test.extend 로 커스텀 fixture 를 만들면
// beforeEach 의 중복 setup 을 spec 별로 따로 적지 않아도 된다.
//
// 사용법:
//   import { test, expect } from './_support/fixtures';
//   test('...', async ({ page }) => { /* 이미 goto + dismiss 완료 상태 */ });
import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// 베타/DB 장애 안내 dialog 의 sessionStorage dismiss 플래그.
// 두 dialog 가 동시에 뜨면 overlay 가 겹쳐 모든 클릭이 막히므로
// 페이지 hydration 전에 미리 플래그를 박아 아예 안 뜨게 한다.
// (use-beta-notice.ts / use-db-outage-notice.ts 참고)
const NOTICE_DISMISS_KEYS = [
  'beta-notice-dismissed-v1',
  'db-outage-notice-dismissed-v1',
];

export async function preDismissNotices(page: Page) {
  await page.addInitScript((keys: string[]) => {
    for (const k of keys) sessionStorage.setItem(k, 'true');
  }, NOTICE_DISMISS_KEYS);
}

// page fixture 자체를 override 한다.
// 모든 spec 의 page 는 이미 "메인 페이지에 진입하고 공지가 닫힌" 상태로 시작.
// baseURL 은 playwright.config.ts 의 use.baseURL 을 따라간다.
export const test = base.extend({
  page: async ({ page }, use) => {
    await preDismissNotices(page);
    await page.goto('/');
    await use(page);
  },
});

export { expect };
