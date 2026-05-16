import { Page, expect } from '@playwright/test';
import { BasePage } from './base-page';
import { projectAccessLoc, ProjectAccessLoc } from './project-access.locators';

/**
 * 프로젝트 접근(식별번호 인증) 페이지의 Page Object.
 *
 * - 경로: `/projects/[slug]/access`
 * - 책임: 식별번호 입력 / 제출 / 에러 단언 / 제출 가능 여부 단언
 * - locator 정의는 `project-access.locators.ts` 로 분리.
 * - 인증 통과 후 페이지 전이는 spec 또는 후속 페이지 객체에서 처리한다.
 */
export class ProjectAccessPage extends BasePage {
  readonly loc: ProjectAccessLoc;

  constructor(page: Page) {
    super(page);
    this.loc = projectAccessLoc(page);
  }

  /**
   * access 페이지로 진입한다.
   *
   * @param slug - 프로젝트 식별 슬러그.
   * @param redirect - 인증 후 이동할 원래 경로 (선택).
   */
  async goto(slug: string, redirect?: string) {
    const query = redirect ? `?redirect=${encodeURIComponent(redirect)}` : '';
    await this.page.goto(`/projects/${slug}/access${query}`);
  }

  /**
   * 식별번호 입력란에 값을 채운다. 값의 유효성 판단은 호출자(spec) 책임.
   */
  async fillCode(code: string) {
    await this.loc.codeInput.fill(code);
  }

  /**
   * "접근하기" 버튼을 클릭해 제출한다.
   */
  async submit() {
    await this.loc.submitButton.click();
  }

  /**
   * 에러 알림 영역에 기대 메시지가 노출되는지 검증한다.
   */
  async expectError(message: string) {
    await expect(this.loc.errorAlert).toHaveText(message);
  }

  /**
   * 제출 버튼이 활성화 상태인지 검증한다.
   */
  async expectSubmitEnabled() {
    await expect(this.loc.submitButton).toBeEnabled();
  }

  /**
   * 제출 버튼이 비활성화 상태인지 검증한다.
   */
  async expectSubmitDisabled() {
    await expect(this.loc.submitButton).toBeDisabled();
  }

  /**
   * 5회 실패 후 차단 안내 화면이 노출됐는지 검증한다.
   */
  async expectBlocked() {
    await expect(this.loc.blockedNotice).toBeVisible();
    await expect(this.loc.backToHomeButton).toBeVisible();
  }
}
