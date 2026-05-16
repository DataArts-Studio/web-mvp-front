import { Page, expect } from '@playwright/test';

/**
 * 모든 Page Object 의 베이스 클래스.
 *
 * - 페이지 단위 공통 동작/검증을 모아둔다. (title, url 등 공통 단언)
 * - 도메인별 Page Object 는 이 클래스를 상속해서 자기 화면 전용 locator·action 을 추가한다.
 * - Playwright `Page` 인스턴스는 fixture 에서 주입받아 생성자로 전달한다.
 *
 * @example
 * class ProjectAccessPage extends BasePage {
 *   constructor(page: Page) { super(page); }
 *   readonly submitButton = this.page.getByRole('button', { name: '접근하기' });
 * }
 */
export abstract class BasePage {
  /**
   * @param page - 테스트 fixture 에서 주입되는 Playwright `Page` 인스턴스.
   */
  constructor(readonly page: Page) {
    this.page = page;
  }
  /**
   * 현재 문서의 `<title>` 이 기대값과 일치하는지 검증한다.
   *
   * @param title - 기대하는 페이지 타이틀 문자열.
   */
  async verifyTitle(title: string) {
    await expect(this.page).toHaveTitle(title);
  }

  /**
   * 현재 페이지 URL 이 기대값과 일치하는지 검증한다.
   *
   * @param url - 기대하는 URL. `toHaveURL` 규칙에 따라 문자열 완전일치 또는 정규식 패턴 매칭이 가능하다.
   */
  async verifyUrl(url: string) {
    await expect(this.page).toHaveURL(url);
  }
}