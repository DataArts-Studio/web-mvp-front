// 잘못된 입력에 대해 step 비진입 + 에러 노출이 되는지 검증.
// 각 step 의 validation 규칙은 project-create-form.tsx 의 handleNext 분기 참고.
import { expect, test } from '../share/utils';
import { openModal, reachStep2 } from './_support/flows';
import { loc } from './_support/locators';

test.describe('프로젝트 생성 - Step1 Validation', () => {
  test('이름 미입력 + 동의 미체크: Step2 진입 불가', async ({ page }) => {
    const l = loc(page);
    await openModal(page);

    await l.step1.nextButton.click();
    // step1 화면이 그대로 유지되어야 한다 (Step2 heading 안 보임)
    await expect(l.step2.heading).toBeHidden();
    await expect(l.step1.projectName).toBeVisible();
  });

  test('이름만 입력 + 동의 미체크: Step2 진입 불가', async ({ page }) => {
    const l = loc(page);
    await openModal(page);

    await l.step1.projectName.fill('e2e-validation');
    await l.step1.nextButton.click();
    await expect(l.step2.heading).toBeHidden();
    await expect(l.step1.projectName).toBeVisible();
  });
});

test.describe('프로젝트 생성 - Step2 Validation', () => {
  test('식별번호 재입력 불일치: 에러 메시지 노출 + Step3 진입 불가', async ({
    page,
  }) => {
    const l = loc(page);
    await reachStep2(page);

    await l.step2.identifier.fill('Pass1234!');
    await l.step2.identifierConfirm.fill('Different!');
    await l.step2.nextButton.click();

    // form-field-message 안의 텍스트로 검증
    await expect(l.step2.errorMessage).toContainText(
      '식별번호가 일치하지 않습니다'
    );
    await expect(l.step3.heading).toBeHidden();
  });
});

test.describe('프로젝트 생성 - Step3 Validation', () => {
  // prod 환경에서만 Turnstile 위젯이 떠서 검증 가능.
  // localhost 에선 siteKey === '' 라 위젯 미렌더 + submit 항상 enabled.
  test.fixme('Turnstile 미통과 시 생성 버튼 disabled (prod 환경)', async () => {});
});
