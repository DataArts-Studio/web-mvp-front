import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

import { projectSearchLoc } from './locators';

// 모달 열기 + 모달이 실제로 떴는지 검증.
// 1) role=dialog 컨테이너 가시성 → 모달이 마운트됐는지
// 2) 모달 내부 검색 input 가시성 → 콘텐츠까지 렌더됐는지
//    (컨테이너만 뜨고 내부가 비어있는 회귀를 같이 잡기 위함)
export async function openModal(page: Page) {
  const loc = projectSearchLoc(page);
  await loc.landing.openModalButton.click();
  await expect(loc.modal).toBeVisible();
  await expect(loc.step1.projectNameInput).toBeVisible();
}
