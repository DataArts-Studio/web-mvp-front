import { type Locator, type Page, expect } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * 접근 페이지가 노출하는 메시지 모음.
 *
 * 출처: 클라이언트 zod(`access/project/model/schema.ts`),
 *       서버 액션(`access/project/api/verify-access.ts`).
 */
export const ACCESS_MESSAGES = {
  required: '비밀번호를 입력해주세요.',
  tooShort: '비밀번호는 최소 8자리 이상이어야 합니다.',
  tooLong: '비밀번호는 최대 16자리 이하여야 합니다.',
  wrongPassword: '비밀번호가 일치하지 않습니다.',
  notFound: '프로젝트를 찾을 수 없거나 비밀번호가 일치하지 않습니다.',
  rateLimited: '너무 많은 시도입니다. 15분 후에 다시 시도해주세요.',
  expired: '접근 권한이 만료되었습니다. 다시 인증해주세요.',
} as const;

/**
 * 프로젝트 접근(식별번호 인증) 게이트 페이지. — 도메인: access
 *
 * - 경로: `/projects/{slug}/access`
 * - 미인증 상태로 보호 라우트 진입 시 미들웨어가 이 페이지로 리다이렉트한다.
 *
 * 구현 사실(검증된 동작):
 * - 입력란은 `<input type="password">` → textbox role 없음 → label 로 식별.
 * - 에러 박스에 role 이 없어 텍스트로 단언한다.
 * - localhost 는 Turnstile siteKey 가 빈 문자열 → 제출 버튼 항상 enabled.
 * - rate-limit 락아웃 15분, 6회째 제출에서 차단 메시지.
 */
export class ProjectAccessPage extends BasePage {
  static readonly messages = ACCESS_MESSAGES;

  readonly heading: Locator;
  readonly codeInput: Locator;
  readonly submitButton: Locator;
  readonly passwordToggle: Locator;
  readonly remainingAttempts: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: '프로젝트 접근' });
    // password input 은 ARIA role 이 없으므로 연결된 label 로 잡는다.
    this.codeInput = page.getByLabel('프로젝트 비밀번호 (식별번호)');
    // pending 중 라벨이 "확인 중..." 으로 바뀐다.
    this.submitButton = page.getByRole('button', { name: /접근하기|확인 중/ });
    this.passwordToggle = page.locator(
      'button:has(svg.lucide-eye), button:has(svg.lucide-eye-off)',
    );
    this.remainingAttempts = page.getByText(/남은 시도 횟수: \d+회/);
  }

  // --- 네비게이션 ---------------------------------------------------------

  /**
   * access 페이지로 직접 진입한다.
   *
   * @param slug - 프로젝트 슬러그(= 프로젝트 이름).
   * @param redirect - 인증 후 이동할 원래 경로 (선택).
   */
  async goto(slug: string, redirect?: string): Promise<void> {
    const query = redirect ? `?redirect=${encodeURIComponent(redirect)}` : '';
    await this.open(`/projects/${slug}/access${query}`);
  }

  /**
   * 보호 라우트로 직접 진입한다. (미들웨어 리다이렉트 검증용)
   *
   * @param path - 진입을 시도할 보호 경로.
   */
  async gotoProtected(path: string): Promise<void> {
    await this.open(path);
  }

  // --- 액션 ---------------------------------------------------------------

  /** 식별번호 입력란을 채운다. */
  async enterCode(code: string): Promise<void> {
    await this.codeInput.fill(code);
  }

  /** "접근하기" 버튼을 클릭한다. */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /** 식별번호 입력 + 제출을 한 번에 수행한다. */
  async authenticate(code: string): Promise<void> {
    await this.enterCode(code);
    await this.submit();
  }

  /** 현재 입력란에 남아있는 값을 반환한다. */
  async currentCode(): Promise<string> {
    return this.codeInput.inputValue();
  }

  // --- 단언 ---------------------------------------------------------------

  /** 접근 게이트 화면(URL + 헤딩)에 있는지 단언한다. */
  async expectAtGate(slug: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/projects/${slug}/access`));
    await expect(this.heading).toBeVisible();
  }

  /**
   * 보호 라우트 접근이 access 페이지로 리다이렉트됐는지 단언한다.
   * 미들웨어는 `?redirect=<원래 경로>` 를 부착한다.
   */
  async expectRedirectedFromProtected(
    slug: string,
    fromPath: string,
  ): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/projects/${slug}/access`));
    const redirect = new URL(this.page.url()).searchParams.get('redirect');
    expect(redirect).toBe(fromPath);
  }

  /** 에러 메시지가 노출되는지 단언한다. (`ProjectAccessPage.messages` 사용 권장) */
  async expectError(message: string): Promise<void> {
    await expect(this.page.getByText(message, { exact: false })).toBeVisible();
  }

  /** "남은 시도 횟수: N회" 안내가 노출되는지 단언한다. */
  async expectRemainingAttempts(count?: number): Promise<void> {
    if (count === undefined) {
      await expect(this.remainingAttempts).toBeVisible();
      return;
    }
    await expect(
      this.page.getByText(`남은 시도 횟수: ${count}회`),
    ).toBeVisible();
  }

  /** rate-limit 차단 메시지가 노출되는지 단언한다. */
  async expectRateLimited(): Promise<void> {
    await this.expectError(ACCESS_MESSAGES.rateLimited);
  }
}
