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
   * 수동으로 기다려 요청이 서버에 닿은 뒤 단언으로 넘어간다.
   *
   * 서버 액션 응답은 헤더를 먼저 보내고 결과를 뒤이어 스트리밍하므로, 여기서 풀려도
   * 저장 트랜잭션이 커밋됐다는 보장은 없다. 본문 완료(response.finished())는 CI 에서
   * 응답이 끝났는데도 풀리지 않는 경우가 있어 쓰지 않는다. 커밋 확인은
   * expectCasePersisted 가 새로고침을 반복하며 한다.
   *
   * 같은 화면에서 { projectId } 만 보내는 다른 조회 액션도 함께 나가므로, "projectId"
   * 만으로 찾으면 그 응답에 먼저 풀려 생성 요청이 새로고침에 끊긴다. 입력한 제목이
   * 본문에 있는 요청을 생성 액션으로 본다. 폼이 제목 앞뒤 공백을 지우고 보내므로 같게 맞춘다.
   */
  async submitAndWaitForPersist(): Promise<void> {
    const title = (await this.titleInput.inputValue()).trim();
    const createResponse = this.page.waitForResponse(
      (res) => {
        const body = res.request().postData() ?? '';
        return (
          res.request().method() === 'POST' &&
          res.url().includes('/cases') &&
          body.includes('"projectId"') &&
          body.includes(JSON.stringify(title))
        );
      },
      { timeout: 15_000 }
    );
    await this.submitButton.click();
    await createResponse;
  }

  /**
   * 새로고침한 목록에 케이스가 남아 있는지 확인한다.
   *
   * 생성 요청이 서버에 닿은 뒤에도 커밋은 조금 늦을 수 있어, 새로고침과 검색을
   * 묶어 보일 때까지 다시 시도한다. 저장되지 않았다면 끝내 보이지 않아 실패한다.
   */
  async expectCasePersisted(slug: string, title: string): Promise<void> {
    await expect(async () => {
      await this.reload();
      await this.expectLoaded(slug);
      await this.expectCaseInTable(title);
    }).toPass({ timeout: 30_000 });
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
