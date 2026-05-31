import { type Locator, type Page, expect } from '@playwright/test';

import { BasePage } from '../base.page';

/**
 * 랜딩(`/`) + 랜딩에서 열리는 프로젝트 생성 모달(`#create-project`) POM.
 *
 * 생성 모달은 독립 URL 이 없고 랜딩의 "무료로 시작하기"로만 진입하므로
 * 랜딩 영역으로 보고 이 POM 이 모달 내부(단계 헤딩/에러/닫기/성공)까지 소유한다.
 * 스펙은 로케이터를 직접 만지지 않고 시맨틱 메서드만 호출한다.
 */
export class LandingPage extends BasePage {
  // 랜딩 표면
  readonly heading: Locator;
  readonly openModalButton: Locator;

  // 생성 모달 본체
  readonly modal: Locator;

  // Step 1
  readonly formHeading: Locator;
  readonly formTitleInput: Locator;
  readonly formTermsCheckbox: Locator;
  readonly formPrivacyCheckbox: Locator;
  readonly formStartButton: Locator;

  // Step 2
  readonly step2Heading: Locator;
  readonly step2CloseButton: Locator;
  readonly step2Error: Locator;
  readonly formPasswordInput: Locator;
  readonly formPasswordConfirmInput: Locator;
  readonly formStepTwoButton: Locator;

  // Step 3
  readonly step3Heading: Locator;
  readonly step3CancelButton: Locator;
  readonly formSubmitButton: Locator;

  // 성공
  readonly successHeading: Locator;
  readonly formProjectUrlCopyButton: Locator;
  readonly startButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByLabel('Testea 홈으로 이동');
    // 버튼의 접근성 이름은 aria-label("무료로 프로젝트 생성 시작하기")이라 표시 텍스트가 아닌
    // aria-label 로 매칭해야 한다. (표시 텍스트는 "무료로 시작하기")
    this.openModalButton = page.getByRole('button', {
      name: '무료로 프로젝트 생성 시작하기',
    });

    // 모달 본체 — 레거시 locators.ts 의 검증된 셀렉터.
    this.modal = page.locator('#create-project[role="dialog"]');

    this.formHeading = page.getByRole('heading', {
      name: '테스트 케이스 작성, 단 5분이면 끝!',
    });
    this.formTitleInput = page.getByPlaceholder(
      '프로젝트 이름을 입력하세요 (예: Testea Web Client)'
    );
    // 체크박스는 <button role="checkbox">(접근가능한 이름 없음) → 감싸는 label 텍스트로 스코프
    this.formTermsCheckbox = page
      .locator('label', { hasText: '이용약관' })
      .getByRole('checkbox');
    this.formPrivacyCheckbox = page
      .locator('label', { hasText: '만 14세 이상' })
      .getByRole('checkbox');
    // 모달 버튼은 모달 스코프로 한정한다. page 전역이면 랜딩 진입 버튼의
    // aria-label("무료로 프로젝트 생성 시작하기")과 부분 매칭돼 strict mode 위반이 난다.
    this.formStartButton = this.modal.getByRole('button', {
      name: '프로젝트 생성 시작',
    });

    // Step 2
    this.step2Heading = this.modal.getByRole('heading', {
      name: '프라이빗 모드로 생성하기',
    });
    this.step2CloseButton = this.modal.getByRole('button', { name: '닫기' });
    this.step2Error = this.modal.locator('p[data-invalid="true"]');
    // 식별번호 입력 (type=password → textbox role 없음 → srOnly label 사용)
    this.formPasswordInput = page.getByLabel(/프로젝트 식별번호/);
    this.formPasswordConfirmInput = page.getByLabel(/식별번호 재확인/);
    this.formStepTwoButton = this.modal.getByRole('button', {
      name: '프로젝트 생성하기',
    });

    // Step 3
    this.step3Heading = this.modal.getByRole('heading', {
      name: '프로젝트를 생성하시겠습니까?',
    });
    this.step3CancelButton = this.modal.getByRole('button', { name: '취소' });
    this.formSubmitButton = this.modal.getByRole('button', {
      name: '생성하기',
      exact: true,
    });

    // 성공
    this.successHeading = this.modal.getByRole('heading', {
      name: '프로젝트 생성 완료!',
    });
    this.formProjectUrlCopyButton = this.modal.getByRole('button', {
      name: '링크 복사',
    });
    this.startButton = this.modal.getByRole('button', { name: '시작하기' });
  }

  // --- 네비게이션 ---------------------------------------------------------
  async goto(): Promise<void> {
    await this.open('/');
  }

  // --- 액션 ---------------------------------------------------------------
  async openModal(): Promise<void> {
    await this.openModalButton.click();
  }

  async enterTitle(text: string): Promise<void> {
    await this.formTitleInput.fill(text);
  }

  async checkTerms(): Promise<void> {
    await this.formTermsCheckbox.check();
  }

  async checkPrivacy(): Promise<void> {
    await this.formPrivacyCheckbox.check();
  }

  async submitStepOneButton(): Promise<void> {
    await this.formStartButton.click();
  }

  /** 식별번호·재확인을 함께 채운다. 불일치 검증은 confirm 에 다른 값을 넘긴다. */
  async enterIdentifier(value: string, confirm: string = value): Promise<void> {
    await this.formPasswordInput.fill(value);
    await this.formPasswordConfirmInput.fill(confirm);
  }

  async submitStepTwoButton(): Promise<void> {
    await this.formStepTwoButton.click();
  }

  async submitCreate(): Promise<void> {
    await this.formSubmitButton.click();
  }

  async closeStep2(): Promise<void> {
    await this.step2CloseButton.click();
  }

  async cancelStep3(): Promise<void> {
    await this.step3CancelButton.click();
  }

  /**
   * 모달 바깥(backdrop) 클릭으로 닫는다. backdrop overlay 로케이터가 없어
   * 다이얼로그 박스 바깥(전체 화면 overlay) 좌상단을 클릭해 닫힘을 유도한다.
   */
  async closeByBackdrop(): Promise<void> {
    await this.page.mouse.click(5, 5);
  }

  async copyProjectUrl(): Promise<void> {
    await this.formProjectUrlCopyButton.click();
  }

  async goToDashboard(): Promise<void> {
    await this.startButton.click();
  }

  // --- 단언 ---------------------------------------------------------------
  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL('/');
    await expect(this.heading).toBeVisible();
  }

  async expectModalOpen(): Promise<void> {
    await expect(this.modal).toBeVisible();
  }

  async expectModalClosed(): Promise<void> {
    await expect(this.modal).toBeHidden();
  }

  /** 제출했지만 진행되지 않고 Step 1 에 머문다. */
  async expectStayedOnStep1(): Promise<void> {
    await expect(this.step2Heading).toBeHidden();
    await expect(this.formTitleInput).toBeVisible();
  }

  async expectStep2(): Promise<void> {
    await expect(this.step2Heading).toBeVisible();
  }

  async expectStep3(): Promise<void> {
    await expect(this.step3Heading).toBeVisible();
  }

  /** 식별번호 불일치 에러가 노출되고 Step 3 로 진행되지 않는다. */
  async expectIdentifierMismatch(): Promise<void> {
    await expect(this.step2Error).toContainText('식별번호가 일치하지 않습니다');
    await expect(this.step3Heading).toBeHidden();
  }

  async expectCreateEnabled(): Promise<void> {
    await expect(this.formSubmitButton).toBeEnabled({ timeout: 15_000 });
  }

  /** Step 3 요약에 입력한 프로젝트 이름이 노출된다. */
  async expectProjectNameInModal(projectName: string): Promise<void> {
    await expect(this.modal.getByText(projectName).first()).toBeVisible();
  }

  async expectSuccess(): Promise<void> {
    await expect(this.successHeading).toBeVisible({ timeout: 15_000 });
  }

  /** 모달을 다시 열었을 때 Step 1 부터 시작하고 입력값이 비어 있다. */
  async expectTitleEmpty(): Promise<void> {
    await expect(this.formTitleInput).toHaveValue('');
  }

  /** "링크 복사"가 클립보드에 올린 값이 프로젝트 URL 과 일치한다. */
  async expectCopiedProjectUrl(projectName: string): Promise<void> {
    const origin = await this.page.evaluate(() => window.location.origin);
    const clipboard = await this.page.evaluate(() =>
      navigator.clipboard.readText()
    );
    expect(clipboard).toBe(
      `${origin}/projects/${encodeURIComponent(projectName)}`
    );
  }

  /** 생성한 프로젝트 대시보드(`/projects/{slug}`)로 도착했다. */
  async expectDashboardLoaded(projectName: string): Promise<void> {
    await expect(this.page).toHaveURL(
      new RegExp(`/projects/${encodeURIComponent(projectName)}(/.*)?$`),
      { timeout: 30_000 }
    );
    await expect(this.page.getByText(projectName).first()).toBeVisible({
      timeout: 15_000,
    });
  }
}
