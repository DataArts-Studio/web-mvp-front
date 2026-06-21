import { type Locator, type Page, expect } from '@playwright/test';

import { BasePage } from '../base.page';

export class ProjectTestcasePage extends BasePage {
  readonly heading: Locator;
  readonly createButton: Locator;
  readonly createDialog: Locator;
  readonly formHeading: Locator;
  readonly titleInput: Locator;
  readonly testcaseTable: Locator;
  readonly searchInput: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', {
      name: '테스트 케이스',
      exact: true,
    });
    this.createButton = page.getByRole('button', { name: '새 케이스' });
    this.createDialog = page.getByRole('dialog', {
      name: '테스트 케이스 생성',
    });
    this.formHeading = page.getByRole('heading', {
      name: '테스트 케이스 생성',
    });
    this.titleInput = page.getByPlaceholder(
      '예: 회원가입 - 이메일 형식이 잘못된 경우'
    );
    this.submitButton = page.getByRole('button', {
      name: '테스트 케이스 생성',
    });
    this.testcaseTable = page.getByLabel('테스트 케이스 목록');
    this.searchInput = page.getByRole('textbox', {
      name: '테스트 케이스 검색',
    });
    this.cancelButton = page.getByRole('button', { name: '취소' });
  }

  async goto(slug: string): Promise<void> {
    await this.open(`/projects/${slug}/cases`);
  }

  /** 영속 확인용 새로고침. (optimistic 이 아닌 실제 저장 여부 단언) */
  async reload(): Promise<void> {
    await this.page.reload();
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

  /**
   * 제출 후 실제 서버 저장까지 보장한다.
   *
   * 생성 폼은 optimistic update라 제출 즉시 닫히고, 실제 저장은 백그라운드 서버
   * 액션(POST)으로 나간다. 제출 직후 곧바로 능동 단언(폴링)으로 들어가면 폴링이
   * 메인 스레드를 점유해, 보류 중인 서버 액션 fetch 가 전송되지 못하고 중단된다
   * (= 케이스가 영속되지 않아 새로고침 시 사라진다). 생성 액션의 네트워크 왕복을
   * 수동으로 기다려 서버 커밋을 보장한 뒤 단언으로 넘어간다.
   *
   * 생성 액션 POST 는 본문에 camelCase "projectId" 를 담아, 목록 조회 액션
   * (snake_case "project_id") 과 구분된다.
   */
  async submitAndWaitForPersist(): Promise<void> {
    const createResponse = this.page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' &&
        res.url().includes('/cases') &&
        (res.request().postData() ?? '').includes('"projectId"'),
      { timeout: 15_000 }
    );
    await this.submitButton.click();
    await createResponse;
  }

  async enterInput(text: string): Promise<void> {
    await this.titleInput.fill(text);
  }

  async expectLoaded(slug: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/projects/${slug}/cases$`), {
      timeout: 30_000,
    });
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

  // 목록은 15건 단위 서버사이드 페이지네이션 + 커스텀 정렬이라, 새로 만든
  // 케이스는 마지막 페이지에 붙어 1페이지 DOM 에는 존재하지 않는다. 누적 데이터에
  // 흔들리지 않도록 제목으로 검색해 결과를 좁힌 뒤 단언한다. (서버사이드 필터)
  async expectCaseInTable(title: string): Promise<void> {
    await this.searchInput.fill(title);
    await expect(this.testcaseTable.getByText(title)).toBeVisible();
  }

  async expectTitleRequiredError(): Promise<void> {
    await expect(
      this.page.getByText('테스트 케이스 제목을 입력해주세요.')
    ).toBeVisible();
    await expect(this.createDialog).toBeVisible();
  }
}
