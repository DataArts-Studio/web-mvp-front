import { type Locator, type Page, expect } from '@playwright/test';

import { BasePage } from '../base.page';

export class ProjectTestsuitePage extends BasePage {
  readonly heading: Locator;
  readonly createButton: Locator;
  readonly createDialog: Locator;
  readonly formHeading: Locator;
  readonly titleInput: Locator;
  readonly searchInput: Locator;
  readonly suiteList: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly backdrop: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: '테스트 스위트 관리' });
    this.createButton = page.getByRole('button', {
      name: '테스트 스위트 생성하기',
    });
    this.createDialog = page.getByRole('dialog', {
      name: '테스트 스위트 생성',
    });
    this.formHeading = page.getByRole('heading', {
      name: '테스트 스위트 생성',
    });
    this.titleInput = page.getByPlaceholder('스위트 이름을 입력해 주세요.');
    this.searchInput = page.getByPlaceholder('스위트 이름 또는 키워드로 검색');
    this.suiteList = page.getByLabel('테스트 스위트 리스트');
    // 트리거('테스트 스위트 생성하기')·진행중('생성 중...')과 겹치므로 exact
    this.submitButton = page.getByRole('button', { name: '생성', exact: true });
    this.cancelButton = page.getByRole('button', { name: '취소' });
    // 모달 바깥(backdrop). 클릭 시 handleAbandon (suite-create-form.tsx 의 section)
    this.backdrop = page.locator('#create-suite');
  }

  async goto(slug: string): Promise<void> {
    await this.open(`/projects/${slug}/suites`);
  }

  /** 영속 확인용 새로고침. (optimistic 이 아닌 실제 저장 여부 단언) */
  async reload(): Promise<void> {
    await this.page.reload();
  }

  async expectLoaded(slug: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/projects/${slug}/suites$`), {
      timeout: 30_000,
    });
    await expect(this.heading).toBeVisible({ timeout: 30_000 });
  }

  async openCreateForm(): Promise<void> {
    await this.createButton.click();
    await expect(this.createDialog).toBeVisible();
  }

  async enterTitle(text: string): Promise<void> {
    await this.titleInput.fill(text);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /** 취소 버튼으로 폼을 닫는다. */
  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  /** 모달 바깥(backdrop) 영역을 클릭해 폼을 닫는다. 다이얼로그는 중앙 정렬이므로 좌상단 모서리를 클릭한다. */
  async closeByBackdrop(): Promise<void> {
    await this.backdrop.click({ position: { x: 5, y: 5 } });
  }

  /** 클라이언트 측 검색 필터. 페이지네이션(7개) 영향 없이 특정 제목의 존재/부재를 단언하기 위해 사용. */
  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
  }

  async expectModalOpen(): Promise<void> {
    await expect(this.createDialog).toBeVisible();
  }

  /** 폼이 닫혔다. (`테스트 스위트 생성` 헤딩 소멸) */
  async expectModalClosed(): Promise<void> {
    await expect(this.formHeading).not.toBeVisible();
  }

  /**
   * 제목으로 검색 필터한 뒤 목록에 노출됨을 단언한다.
   * 카드에는 헤딩(h2) + 보조 sr-only 텍스트가 함께 들어 있어 단순 getByText 가
   * strict-mode 위반을 일으킨다. 헤딩 role 로 좁혀 정확히 한 요소만 매칭한다.
   */
  async expectSuiteInList(title: string): Promise<void> {
    await this.search(title);
    await expect(
      this.suiteList.getByRole('heading', { name: title })
    ).toBeVisible();
  }

  /** 제목으로 검색 필터한 뒤 목록에 없음을 단언한다. (헤딩 단언과 대칭) */
  async expectSuiteNotInList(title: string): Promise<void> {
    await this.search(title);
    // 숨김/부재를 구분 못 하는 not.toBeVisible 대신 "0개"로 명확히 단언한다.
    await expect(
      this.suiteList.getByRole('heading', { name: title })
    ).toHaveCount(0);
  }

  /** 폼 재오픈 시 이전 입력값이 남아 있지 않음을 단언한다. (이탈 후 상태 누수 회귀 방지) */
  async expectTitleInputEmpty(): Promise<void> {
    await expect(this.titleInput).toHaveValue('');
  }

  /**
   * 제목 검증 실패 단언.
   * 폼 resolver 는 zodResolver(CreateTestSuiteSchema) 라 RHF register 룰은 무시되고
   * zod 의 `.min(3, '최소 3자 이상')` 메시지만 노출된다. (scenario.md 구현 메모 참조)
   */
  async expectTitleValidationError(): Promise<void> {
    await expect(this.page.getByText('최소 3자 이상')).toBeVisible();
    await expect(this.createDialog).toBeVisible();
  }
}
