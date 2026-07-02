import { describe, expect, it } from 'vitest';

import { CHALLENGES, type Challenge } from './registry';
import { gradeSubmissionStatically } from './static-grader';

// 채점 라우트(/api/challenges/[slug]/run)는 sandboxSlug 있는 챌린지만 처리한다.
const sandboxChallenges = CHALLENGES.filter((c) => c.sandboxSlug);

function goodSubmission(c: Challenge): string {
  const ids = (c.selectors ?? []).map((s) => s.testid);
  const a = ids[0] ?? 'root';
  const b = ids[1] ?? a;
  // Add enough assertions to avoid partial coverage.
  const reqCount = c.requirement?.length ?? 1;
  const asserts = Array.from(
    { length: reqCount },
    () => `  await expect(page.getByTestId('${b}')).toBeVisible();`
  ).join('\n');

  if (c.category === 'pom') {
    return `import { test as base, expect, type Locator, type Page } from '@playwright/test';
const test = base.extend<{ loginPage: LoginPage }>({
  loginPage: async ({ page }, use) => { await use(new LoginPage(page)); },
});
test.use({ storageState: 'auth.json' });
class LoginPage {
  readonly target: Locator;
  constructor(private readonly page: Page) { this.target = page.getByTestId('${a}'); }
  async moveToTarget() { await this.page.goto('/sandbox/${c.sandboxSlug}'); }
  async performMainAction(value = 'tester') { await this.target.fill(value).catch(async () => this.target.click()); }
  async checkMainState() { await expect(this.target).toBeVisible(); }
}
class SignupPage extends LoginPage {}
class NavigationPage extends LoginPage {}
class CatalogPage extends LoginPage {}
class CartPage extends LoginPage {}
class CheckoutPage extends LoginPage {}
class AuthPage extends LoginPage {}
class DataTablePage extends LoginPage {}
class ModalPage extends LoginPage {}
class ProductPage extends LoginPage {}
class RegressionPage extends LoginPage {}

test.beforeEach(async ({ loginPage }) => {
  await loginPage.moveToTarget();
});

describe('risk area @regression @critical', () => {
  test('faithful pom submission @smoke', async ({ loginPage }) => {
    await loginPage.performMainAction();
    await loginPage.checkMainState();
  });

  test('second faithful pom submission @regression', async ({ loginPage }) => {
    await loginPage.performMainAction('qaground123');
    await loginPage.checkMainState();
  });
});`;
  }

  return `import { test, expect } from '@playwright/test';
test('faithful submission', async ({ page }) => {
  await page.goto('/sandbox/${c.sandboxSlug}');
  await page.getByTestId('${a}').click();
${asserts}
});`;
}

const badSubmission = `import { test, expect } from '@playwright/test';
test('빈약한 제출', async () => {
  const x = 1;
});`;

describe('정적 채점: 모든 sandbox 챌린지', () => {
  it('대상 챌린지가 충분히 있다', () => {
    expect(sandboxChallenges.length).toBeGreaterThan(10);
  });

  it.each(sandboxChallenges)('충실한 제출은 통과: $slug', (c) => {
    const r = gradeSubmissionStatically(c, goodSubmission(c));
    expect(r.ok).toBe(true);
    expect(r.status).toBe('passed');
  });

  it.each(sandboxChallenges)('빈약한 제출은 실패: $slug', (c) => {
    const r = gradeSubmissionStatically(c, badSubmission);
    expect(r.ok).toBe(false);
    expect(r.status).toBe('failed');
  });
});
