import { type Locator, type Page, expect } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * 프로젝트 대시보드 페이지. — 도메인: project (FDD-PJT02)
 *
 * 인증 통과 후 도착지이자 앱 메인 엔트리.
 * - 경로: `/projects/{slug}`
 * - SSR 헤더 + CSR(React Query) 콘텐츠 구조.
 *
 * 구현 사실:
 * - H1 은 프로젝트명이 아니라 고정 텍스트 "대시보드" (서버 렌더, 스켈레톤 무관).
 * - 프로젝트명은 "내 프로젝트 정보" 카드(`[data-tour="project-info"]`) 텍스트로만 노출.
 * - access 게이트에서는 사이드바(`#aside`)가 렌더되지 않는다.
 */
export class ProjectDashboardPage extends BasePage {
  readonly heading: Locator;
  readonly sidebar: Locator;
  readonly kpiSection: Locator;
  readonly projectInfoCard: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: '대시보드' });
    this.sidebar = page.locator('#aside');
    this.kpiSection = page.locator('[data-tour="kpi-cards"]');
    this.projectInfoCard = page.locator('[data-tour="project-info"]');
  }

  /**
   * 대시보드로 직접 진입한다. (보호 라우트 — 미인증 시 게이트로 리다이렉트)
   *
   * @param slug - 프로젝트 슬러그.
   */
  async goto(slug: string): Promise<void> {
    await this.open(`/projects/${slug}`);
  }

  /** 대시보드가 정상 노출됐는지(URL + 서버 렌더 헤딩) 단언한다. */
  async expectLoaded(slug: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/projects/${slug}$`));
    await expect(this.heading).toBeVisible();
  }

  /** "내 프로젝트 정보" 카드에 기대 프로젝트명이 노출되는지 단언한다. */
  async expectProjectName(name: string): Promise<void> {
    await expect(
      this.projectInfoCard.getByText(name, { exact: true }),
    ).toBeVisible();
  }

  /** KPI 카드 섹션이 렌더됐는지 단언한다. */
  async expectKpiVisible(): Promise<void> {
    await expect(this.kpiSection).toBeVisible();
  }

  /** 프로젝트 사이드바(LNB)가 노출되는지 단언한다. */
  async expectSidebarVisible(): Promise<void> {
    await expect(this.sidebar).toBeVisible();
  }
}
