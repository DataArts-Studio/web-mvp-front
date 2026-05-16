import { Page } from '@playwright/test'
import { BasePage } from './base-page'

export class ProjectAccessPage extends BasePage{
  readonly page: Page;

  constructor(page: Page) {
    super(page);
    this.page = page;
  }

  // 페이지 접근
  async open(url: string) {
    await this.page.goto(url);
  }
}