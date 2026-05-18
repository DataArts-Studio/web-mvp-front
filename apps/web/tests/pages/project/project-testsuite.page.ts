import { type Locator, type Page, expect } from '@playwright/test';
import { BasePage } from '../base.page';

export class ProjectTestsuitePage extends BasePage {
  readonly heading: Locator;
  readonly createButton: Locator;
  readonly createDialog: Locator;
  readonly formHeading: Locator;
  readonly titleInput: Locator;
  readonly suiteList: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: '테스트 스위트 관리' });
    this.createButton = page.getByRole('button', { name: '테스트 스위트 생성하기' });
    this.createDialog = page.getByRole('dialog', { name: '테스트 스위트 생성' });
    this.formHeading = page.getByRole('heading', { name: '테스트 스위트 생성' });
    this.titleInput = page.getByPlaceholder('스위트 이름을 입력해 주세요.');
    this.suiteList = page.getByLabel('테스트 스위트 리스트');
    // 트리거('테스트 스위트 생성하기')·진행중('생성 중...')과 겹치므로 exact
    this.submitButton = page.getByRole('button', { name: '생성', exact: true });
    this.cancelButton = page.getByRole('button', { name: '취소' });
  }
}
