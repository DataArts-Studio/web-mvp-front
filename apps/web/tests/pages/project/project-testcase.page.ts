import { type Locator, type Page, expect } from '@playwright/test';

import { BasePage } from '../base.page';

export class ProjectTestcasePage extends BasePage {
  readonly heading: Locator;
  readonly createButton: Locator;
  readonly createDialog: Locator;
  readonly formHeading: Locator;
  readonly titleInput: Locator;
  readonly testcaseTable: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: '테스트 케이스', exact: true });
    this.createButton = page.getByRole('button', { name: '새 케이스' });
    this.createDialog = page.getByRole('dialog', { name: '테스트 케이스 생성' });
    this.formHeading = page.getByRole('heading', { name: '테스트 케이스 생성' });
    this.titleInput = page.getByPlaceholder('예: 회원가입 - 이메일 형식이 잘못된 경우');
    this.submitButton = page.getByRole('button', { name: '테스트 케이스 생성' });
    this.testcaseTable = page.getByLabel('테스트 케이스 목록');
    this.cancelButton = page.getByRole('button', { name: '취소' });
  }

  async goto(slug: string): Promise<void> {
    await this.open(`/projects/${slug}/cases`);
  }

  async openCreateForm(): Promise<void> {
    await this.createButton.click();
  }

  async closeCreateForm(): Promise<void> {
    await this.cancelButton.click();
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async enterInput(text: string): Promise<void> {
    await this.titleInput.fill(text);
  }

  async expectLoaded(slug: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/projects/${slug}/cases$`), { timeout: 30_000 });
  }

  async expectOpenModalVisible(): Promise<void> {
    await expect(this.createDialog).toBeVisible();
  }

  async expectPageVisible(): Promise<void> {
    await expect(this.createDialog).not.toBeVisible();
    await expect(this.heading).toBeVisible();
  }

  async expectTestCaseNotInList(title: string): Promise<void> {
    const testcase = this.testcaseTable.getByText(title);
    await expect(testcase).not.toBeVisible();
  }

  async expectCaseInTable(title: string): Promise<void> {
    await expect(this.testcaseTable.getByText(title)).toBeVisible();
  }

  async expectTitleRequiredError(): Promise<void> {
    await expect(this.page.getByText('테스트 케이스 제목을 입력해주세요.')).toBeVisible();
    await expect(this.createDialog).toBeVisible();
  }
}
