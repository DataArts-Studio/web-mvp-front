import type { Page } from '@playwright/test';

/**
 * 모든 Page Object 의 추상 베이스.
 *
 * 실무 권장 POM 원칙:
 * - Page Object 는 Playwright `Page` 를 주입받아 보관한다.
 * - 화면별 locator 는 하위 클래스 생성자에서 `readonly Locator` 로 선언한다.
 * - 베이스에는 화면 무관 공통 동작만 둔다. (도메인 로직 금지)
 */
export abstract class BasePage {
  protected constructor(readonly page: Page) {}

  /**
   * 경로로 이동한다. (playwright.config 의 baseURL 기준 상대경로 허용)
   *
   * @param path - 이동할 경로.
   */
  protected async open(path: string): Promise<void> {
    await this.page.goto(path);
  }
}
