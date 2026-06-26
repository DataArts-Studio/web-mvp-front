import { describe, expect, it } from 'vitest';

import type { Challenge } from './registry';
import { gradeSubmissionStatically } from './static-grader';

const challenge: Challenge = {
  slug: 'login-basic',
  title: '로그인 폼 자동화',
  track: 'automation',
  category: 'auth',
  difficulty: 'easy',
  tools: ['Playwright'],
  summary: '로그인 동작 검증',
  requirement: ['유효 자격증명 성공', '무효 자격증명 에러', '필수 입력 에러'],
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
    expect(r.errorMessage).toContain('임시 정적 채점');
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
});
