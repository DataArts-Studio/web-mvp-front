import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

import { NOTICE_DISMISS_KEYS } from './constant';

// 페이지 로드 전 실행
// 앱 시작시 세션 스토리지 값을 확인후 모달 on/off 여부 확인
// UI 조작 없음, flaky 가능성 낮음
// 앱이 sessionStorage.getItem(key) === 'true' 같은 식으로 체크하는 로직이 있어야 동작
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
