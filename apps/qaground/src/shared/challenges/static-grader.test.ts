import { describe, expect, it } from 'vitest';

import type { Challenge } from './registry';
import { gradeSubmissionStatically, validateAutomationSubmissionShape } from './static-grader';

const challenge: Challenge = {
  slug: 'login-basic',
  title: '로그인 폼 자동화',
  track: 'automation',
  category: 'auth',
  difficulty: 'easy',
  tools: ['Playwright'],
  summary: '로그인 동작 검증',
  requirement: ['유효 자격증명 성공'],
  sandboxSlug: 'login-basic',
  selectors: [
    { name: '아이디', testid: 'username', desc: '' },
    { name: '비밀번호', testid: 'password', desc: '' },
    { name: '로그인', testid: 'login-submit', desc: '' },
    { name: '성공', testid: 'login-success', desc: '' },
  ],
  starterSpec: `import { test, expect } from '@playwright/test';

test('내 테스트', async ({ page }) => {
  await page.goto('/');
  // TODO: 작성
});
`,
};

const goodCode = `import { test, expect } from '@playwright/test';

test('유효 로그인', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('username').fill('tester');
  await page.getByTestId('password').fill('qaground123');
  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('login-success')).toBeVisible();
});
`;

describe('gradeSubmissionStatically', () => {
  it('구조·셀렉터·단언을 갖춘 시도는 통과한다', () => {
    const r = gradeSubmissionStatically(challenge, goodCode);
    expect(r.ok).toBe(true);
    expect(r.status).toBe('passed');
    expect(r.errorMessage).toContain('구조 점검 통과');
  });

  it('빈 테스트 본문은 러너 실행 전 사전 검증에서 실패한다', () => {
    const emptyBody = `import { test, expect } from '@playwright/test';

test('잘못된 자격증명으로는 에러가 출력되고 성공 메세지가 출력되지 않는지 검증한다.', () => {

});`;
    const r = validateAutomationSubmissionShape(emptyBody);
    expect(r).not.toBeNull();
    expect(r?.ok).toBe(false);
    expect(r?.errorMessage).toContain('테스트 본문이 비어 있습니다');
  });

  it('여러 테스트 중 하나가 비어 있으면 전체 제출을 실패시킨다', () => {
    const mixed = `import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('유효한 자격증명으로 로그인하면 환영 메시지가 보인다', async ({ page }) => {
  await page.getByLabel('username').fill('tester');
  await page.getByLabel('password').fill('qaground123');
  await page.getByLabel('login-submit').click();
  await expect(page.getByLabel('login-success')).toHaveText(/환영합니다/);
});

test('잘못된 자격증명으로는 에러가 출력되고 성공 메세지가 출력되지 않는지 검증한다.', () => {

});`;
    const r = validateAutomationSubmissionShape(mixed);
    expect(r).not.toBeNull();
    expect(r?.ok).toBe(false);
    expect(r?.errorMessage).toContain('잘못된 자격증명');
    expect(r?.errorMessage).toContain('테스트 본문이 비어 있습니다');
  });

  it('beforeEach를 쓰더라도 각 테스트 본문이 채워져 있으면 통과한다', () => {
    const multi = `import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('성공 로그인', async ({ page }) => {
  await page.getByLabel('username').fill('tester');
  await page.getByLabel('password').fill('qaground123');
  await page.getByLabel('login-submit').click();
  await expect(page.getByLabel('login-success')).toHaveText(/환영합니다/);
});

test('실패 로그인', async ({ page }) => {
  await page.getByLabel('username').fill('tester');
  await page.getByLabel('password').fill('wrong');
  await page.getByLabel('login-submit').click();
  await expect(page.getByLabel('login-error')).toHaveText(/올바르지 않습니다/);
});`;
    const r = gradeSubmissionStatically(challenge, multi);
    expect(r.ok).toBe(true);
    expect(r.errorMessage).toContain('테스트 2개');
  });

  it('Playwright 액션과 locator 단언을 await 하지 않으면 실패한다', () => {
    const unawaited = `import { test, expect } from '@playwright/test';

test('대기를 빠뜨린 로그인 테스트', async ({ page }) => {
  page.getByLabel('username').fill('tester');
  page.getByLabel('password').fill('qaground123');
  page.getByLabel('login-submit').click();
  expect(page.getByLabel('login-success')).toHaveText(/환영합니다/);
});`;
    const r = validateAutomationSubmissionShape(unawaited);
    expect(r).not.toBeNull();
    expect(r?.ok).toBe(false);
    expect(r?.errorMessage).toContain('await expect');
    expect(r?.errorMessage).toContain('액션은 await');
  });
  it('스타터를 수정하지 않으면 실패한다', () => {
    const r = gradeSubmissionStatically(challenge, challenge.starterSpec!);
    expect(r.ok).toBe(false);
    expect(r.errorMessage).toContain('스타터');
  });

  it('단언이 없으면 실패한다', () => {
    const noAssert = `import { test } from '@playwright/test';
test('t', async ({ page }) => {
  await page.getByTestId('username').fill('x');
});`;
    const r = gradeSubmissionStatically(challenge, noAssert);
    expect(r.ok).toBe(false);
    expect(r.errorMessage).toContain('expect');
  });

  it('주석 속 expect 힌트는 단언으로 인정하지 않는다', () => {
    const onlyComment = `import { test, expect } from '@playwright/test';
test('t', async ({ page }) => {
  await page.getByTestId('username').fill('x');
  // expect(page.getByTestId('login-success')).toBeVisible();
});`;
    const r = gradeSubmissionStatically(challenge, onlyComment);
    expect(r.ok).toBe(false);
  });

  it('testid·접근성 셀렉터를 모두 안 쓰면(CSS만) 실패한다', () => {
    const cssOnly = `import { test, expect } from '@playwright/test';
test('t', async ({ page }) => {
  await page.goto('/');
  await page.locator('button').click();
  await expect(page.locator('h1')).toBeVisible();
});`;
    const r = gradeSubmissionStatically(challenge, cssOnly);
    expect(r.ok).toBe(false);
    expect(r.errorMessage).toContain('셀렉터');
  });

  it('role·label 기반 접근성 셀렉터도 통과로 인정한다', () => {
    const roleBased = `import { test, expect } from '@playwright/test';
test('로그인 성공', async ({ page }) => {
  await page.goto('/sandbox/login-basic');
  await page.getByLabel('아이디').fill('tester');
  await page.getByLabel('비밀번호').fill('qaground123');
  await page.getByRole('button', { name: '로그인' }).click();
  await expect(page.getByRole('status')).toContainText('성공');
});`;
    const r = gradeSubmissionStatically(challenge, roleBased);
    expect(r.ok).toBe(true);
    expect(r.errorMessage).toContain('접근성 기반 셀렉터');
  });

  it('상호작용이 없으면 실패한다', () => {
    const noInteraction = `import { test, expect } from '@playwright/test';
test('t', async () => {
  expect('username').toBe('username');
});`;
    const r = gradeSubmissionStatically(challenge, noInteraction);
    expect(r.ok).toBe(false);
    expect(r.errorMessage).toContain('상호작용');
  });

  it('셀렉터가 없는 챌린지는 셀렉터 규칙을 건너뛴다', () => {
    const noSelectorChallenge: Challenge = { ...challenge, selectors: undefined };
    const code = `import { test, expect } from '@playwright/test';
test('t', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button').click();
  await expect(page.getByText('ok')).toBeVisible();
});`;
    const r = gradeSubmissionStatically(noSelectorChallenge, code);
    expect(r.ok).toBe(true);
  });

  it('요구사항보다 적게 작성하면 부분(partial)으로 처리한다', () => {
    const multiReq: Challenge = { ...challenge, requirement: ['r1', 'r2', 'r3', 'r4'] };
    // goodCode 는 테스트 1개·단언 1개라 요구사항 4개에 못 미친다.
    const r = gradeSubmissionStatically(multiReq, goodCode);
    expect(r.ok).toBe(false);
    expect(r.status).toBe('partial');
    expect(r.errorMessage).toContain('부분 작성');
  });

  it('요구사항 수만큼 작성하면 통과한다', () => {
    const multiReq: Challenge = { ...challenge, requirement: ['r1', 'r2', 'r3'] };
    const fullCode = `import { test, expect } from '@playwright/test';
test('전체', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('username').fill('tester');
  await page.getByTestId('password').fill('qaground123');
  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('login-success')).toBeVisible();
  await expect(page.getByTestId('username')).toBeVisible();
  await expect(page.getByTestId('password')).toBeVisible();
});`;
    const r = gradeSubmissionStatically(multiReq, fullCode);
    expect(r.ok).toBe(true);
    expect(r.status).toBe('passed');
  });
});
