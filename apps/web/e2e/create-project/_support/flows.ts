// step 진입 helper.
// cancel / validation spec 은 "Step2 화면에 있는 상태" 같은 사전조건이 필요한데
// 그 setup 을 spec 마다 반복해서 적으면 가독성도 떨어지고 셀렉터 변경 시
// 여러 곳을 동시에 고쳐야 한다. 진입 흐름은 여기서 한 번만 정의.
import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

import { loc } from './locators';

interface ReachOptions {
  projectName?: string;
  identifier?: string;
}

// 매 실행 고유한 이름. 베타 제한 "프로젝트 최대 1개" 때문에
// 실제로는 cleanup 까지 같이 가야 하지만, 일단 충돌은 피할 수 있다.
function uniqueName() {
  return `e2e-${Date.now()}`;
}

// 모달을 열고 Step1 까지만 진입.
// "버튼 클릭 → 모달 보임 → Step1 입력 필드 보임" 까지 어서션.
export async function openModal(page: Page) {
  const l = loc(page);
  await l.landing.openModalButton.click();
  await expect(l.modal).toBeVisible();
  await expect(l.step1.projectName).toBeVisible();
}

// Step1 입력 완료 후 Step2 로 진입.
// 반환값으로 사용한 입력 데이터를 넘겨 후속 어서션에서 활용 가능.
export async function reachStep2(page: Page, opts: ReachOptions = {}) {
  const l = loc(page);
  const projectName = opts.projectName ?? uniqueName();

  await openModal(page);
  await l.step1.projectName.fill(projectName);
  await l.step1.termsAgree.check();
  await l.step1.ageConfirm.check();
  await l.step1.nextButton.click();

  await expect(l.step2.heading).toBeVisible();
  return { projectName };
}

// Step2 입력 완료 후 Step3 로 진입.
export async function reachStep3(page: Page, opts: ReachOptions = {}) {
  const l = loc(page);
  const identifier = opts.identifier ?? 'Pass1234!';
  const { projectName } = await reachStep2(page, opts);

  await l.step2.identifier.fill(identifier);
  await l.step2.identifierConfirm.fill(identifier);
  await l.step2.nextButton.click();

  await expect(l.step3.heading).toBeVisible();
  return { projectName, identifier };
}
