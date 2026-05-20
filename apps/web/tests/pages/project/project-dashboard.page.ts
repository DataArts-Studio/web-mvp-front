import { type Locator, type Page, expect } from '@playwright/test';

import { BasePage } from '../base.page';

export class ProjectDashboardPage extends BasePage {
  readonly heading: Locator;
  readonly kpiSection: Locator;
  readonly projectInfoCard: Locator;
  readonly milestoneSection: Locator;
  readonly testCasesSection: Locator;
  readonly testSuitesSection: Locator;
  readonly sidebar: Locator;
  readonly searchModalButton: Locator;
  readonly searchModal: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: '대시보드' });
    this.kpiSection = page.locator('[data-tour="kpi-cards"]');
    this.projectInfoCard = page.locator('[data-tour="project-info"]');
    this.milestoneSection = page.locator('[data-tour="test-status-chart"]');
    this.testCasesSection = page.locator('[data-tour="test-cases"]');
    this.testSuitesSection = page.locator('[data-tour="test-suites"]');
    this.sidebar = page.locator('#aside');
    this.searchModalButton = page.getByRole('button', { name: '검색' });
    this.searchModal = page.getByLabel('커맨드 팔레트');
  }

  // 인증 후 렌더링 확인
  // 최초 접근시 온보딩 출력여부(수동테스트)
  // 사이드메뉴 접근(route)
  // 테스트 케이스 추가 확인
  // 테스트 스위트 추가 확인
  // 전체보기 클릭시 해당 페이지로 이동하는지 확인
  async goto(slug: string): Promise<void> {
    await this.open(`/projects/${slug}`);
  }

  // --- 액션 ---------------------------------------------------------------
  async openSearchModal(type: 'enter' | 'click'): Promise<void> {
    // 타입별로 모달 오픈
    if (type === 'click') await this.searchModalButton.click();
    else await this.searchModalButton.press('Control+k');
  }

  async enterSearchTextAndSubmit(text: string): Promise<void> {}

  async clickSearchActionList(text: string): Promise<void> {}

  async enterSearchActionList(text: string): Promise<void> {}

  async clickOnNavigation(path: string): Promise<void> {}

  async clickAddButton(type: 'test-case' | 'test-suite'): Promise<void> {}

  async enterInput(locator: Locator, text: string): Promise<void> {}

  async submit(locator: Locator): Promise<void> {}

  async cancel(locator: Locator): Promise<void> {}

  // --- 단언 ---------------------------------------------------------------
  async expectLoaded(slug: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/projects/${slug}$`), {
      timeout: 30_000,
    });
    await expect(this.heading).toBeVisible();
  }

  async expectSectionsVisible(): Promise<void> {
    await expect(this.kpiSection).toBeVisible();
    await expect(this.projectInfoCard).toBeVisible();
    await expect(this.milestoneSection).toBeVisible();
    await expect(this.testCasesSection).toBeVisible();
    await expect(this.testSuitesSection).toBeVisible();
  }

  async expectSidebarVisible(): Promise<void> {
    await expect(this.sidebar).toBeVisible();
  }

  async expectProjectName(slug: string): Promise<void> {}

  async expectProjectUrlCopy(): Promise<void> {}

  async expectNavigationTo(path: string): Promise<void> {}

  async expectSearchBarVisible(): Promise<void> {
    await expect(this.searchModal).toBeVisible();
  }
}
