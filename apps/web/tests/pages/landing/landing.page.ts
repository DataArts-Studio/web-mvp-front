import { type Locator, type Page, expect } from '@playwright/test';

import { BasePage } from '../base.page';

export class LandingPage extends BasePage {
  readonly heading: Locator;
  readonly openModalButton: Locator;
  readonly formHeading: Locator;
  readonly formTitleInput: Locator;
  readonly formTermsCheckbox: Locator;
  readonly formPrivacyCheckbox: Locator;
  readonly formPasswordInput: Locator;
  readonly formPasswordConfirmInput: Locator;
  readonly formSubmitButton: Locator;
  readonly formProjectUrlCopyButton: Locator;
  readonly startButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByLabel('Testea 홈으로 이동');
    this.openModalButton = page.getByRole('button', { name: '무료로 시작하기' });
    this.formHeading = page.getByRole('heading', { name: '테스트 케이스 작성, 단 5분이면 끝!' });
    this.formTitleInput = page.getByPlaceholder(
      '프로젝트 이름을 입력하세요 (예: Testea Web Client)'
    );
    // 체크박스는 <button role="checkbox">(접근가능한 이름 없음)
    // 감싸는 label 텍스트로 스코프
    this.formTermsCheckbox = page
      .locator('label', { hasText: '이용약관' })
      .getByRole('checkbox');
    this.formPrivacyCheckbox = page
      .locator('label', { hasText: '만 14세 이상' })
      .getByRole('checkbox');
    // Step2 식별번호 입력 (type=password → textbox role 없음 → srOnly label 사용)
    this.formPasswordInput = page.getByLabel(/프로젝트 식별번호/);
    this.formPasswordConfirmInput = page.getByLabel(/식별번호 재확인/);
    this.formSubmitButton = page.getByRole('button', { name: '생성하기', exact: true });
    this.formProjectUrlCopyButton = page.getByRole('button', { name: '링크 복사' });
    this.startButton = page.getByRole('button', { name: '시작하기' });
  }
}
