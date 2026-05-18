import { redirect } from 'next/navigation';

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

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: '대시보드' });
    this.kpiSection = page.locator('[data-tour="kpi-cards"]');
    this.projectInfoCard = page.locator('[data-tour="project-info"]');
    this.milestoneSection = page.getByText(
      '테스트 현황asdasdadas총 47개의 케이스11%'
    );
    this.testCasesSection = page.getByText('테스트 케이스(52)추가TC-057BVT');
    this.testSuitesSection = page.getByText(
      '테스트 스위트(10)추가ㄴㅁㅇㄻㄴㅇㄻㄴㅇㄹㅁㄴㅇㄻㄴㅇ케이스 3개test suite설명 없음케이스 4개test suite 2설명 없음케이스 3개'
    );
    this.sidebar = page.locator('#aside');
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
  async enterSearchText(text: string): Promise<void> {}

  async clickOnNavigation(path: string): Promise<void> {}

  async clickAddButton(type: 'test-case' | 'test-suite'): Promise<void> {}

  // --- 단언 ---------------------------------------------------------------
  async expectLoaded(slug: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/projects/${slug}$`));
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

  async expectProjectName(slug: string): Promise<void> {

  }

  async expectProjectUrlCopy(): Promise<void> {}

  async expectNavigationTo(path: string): Promise<void> {}

  async expectSearchBarVisible(): Promise<void> {}
}
