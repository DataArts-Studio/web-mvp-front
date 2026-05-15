import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

import { projectSearchLoc } from './locators';

// 모달을 열고 Step1 까지 접근.
export async function openModal(page: Page) {
  const loc = projectSearchLoc(page);
  await loc.landing.openModalButton.click();
  await expect(loc.step1.heading).toBeVisible();
}

export async function reachStep2(page: Page) {
  const loc = projectSearchLoc(page);
}

export async function reachStep3(page: Page) {
  const loc = projectSearchLoc(page);
}
