// 각 step 에서 모달을 닫았을 때 모달이 사라지는지 검증한다.
// "닫은 뒤 다시 열었을 때 입력값이 비어있는가" 같은 추가 시나리오는 별도 분리 가능.
import { expect, test } from '../share/utils';
import { openModal, reachStep2, reachStep3 } from './_support/flows';
import { loc } from './_support/locators';

test.describe('프로젝트 생성 - 취소 시나리오', () => {
  test('[Step1] 돌아가기 클릭 시 모달이 닫힌다', async ({ page }) => {
    const l = loc(page);

    await openModal(page);
    await l.step1.closeButton.click();
    await expect(l.modal).toBeHidden();
  });

  test('[Step2] X 버튼 클릭 시 모달이 닫힌다', async ({ page }) => {
    const l = loc(page);

    await reachStep2(page);
    await l.step2.closeButton.click();
    await expect(l.modal).toBeHidden();
  });

  test('[Step3] 취소 버튼 클릭 시 모달이 닫힌다', async ({ page }) => {
    const l = loc(page);

    await reachStep3(page);
    await l.step3.cancelButton.click();
    await expect(l.modal).toBeHidden();
  });
});
