import 'server-only';

import type { ChallengeSolution } from './solution-types';

const SOLUTIONS: Record<string, ChallengeSolution> = {
  'login-basic': {
    approach: [
      '성공 경로와 실패 경로를 별도 테스트로 분리해 원인을 빠르게 찾을 수 있게 한다.',
      '입력과 클릭 같은 사용자 행동은 await로 기다리고, 결과는 expect로 명시적으로 단언한다.',
      '필수 입력 경계는 아이디만 빈 경우, 비밀번호만 빈 경우, 둘 다 빈 경우를 각각 확인한다.',
      '에러 상태 이후 재로그인처럼 상태 전환이 있는 흐름은 이전 메시지가 사라지는지도 함께 확인한다.',
    ],
    code: `import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('유효한 자격증명으로 로그인하면 환영 메시지가 보인다', async ({ page }) => {
  await page.getByTestId('username').fill('tester');
  await page.getByTestId('password').fill('qaground123');
  await page.getByTestId('login-submit').click();

  await expect(page.getByTestId('login-success')).toHaveText(
    /환영합니다, tester님. 로그인에 성공했습니다./
  );
  await expect(page.getByTestId('login-error')).not.toBeVisible();
});

test('잘못된 자격증명으로는 에러가 출력되고 성공 메시지가 출력되지 않는다', async ({ page }) => {
  await page.getByTestId('username').fill('tester');
  await page.getByTestId('password').fill('wrong-password');
  await page.getByTestId('login-submit').click();

  await expect(page.getByTestId('login-error')).toHaveText(
    /아이디 또는 비밀번호가 올바르지 않습니다./
  );
  await expect(page.getByTestId('login-success')).not.toBeVisible();
});

test('아이디만 비우면 필수 입력 에러가 출력된다', async ({ page }) => {
  await page.getByTestId('password').fill('qaground123');
  await page.getByTestId('login-submit').click();

  await expect(page.getByTestId('login-error')).toHaveText(
    /아이디와 비밀번호를 모두 입력하세요./
  );
  await expect(page.getByTestId('login-success')).not.toBeVisible();
});

test('비밀번호만 비우면 필수 입력 에러가 출력된다', async ({ page }) => {
  await page.getByTestId('username').fill('tester');
  await page.getByTestId('login-submit').click();

  await expect(page.getByTestId('login-error')).toHaveText(
    /아이디와 비밀번호를 모두 입력하세요./
  );
  await expect(page.getByTestId('login-success')).not.toBeVisible();
});

test('아이디와 비밀번호를 모두 비우면 필수 입력 에러가 출력된다', async ({ page }) => {
  await page.getByTestId('login-submit').click();

  await expect(page.getByTestId('login-error')).toHaveText(
    /아이디와 비밀번호를 모두 입력하세요./
  );
  await expect(page.getByTestId('login-success')).not.toBeVisible();
});

test('에러 상태에서 다시 올바르게 로그인하면 성공할 수 있다', async ({ page }) => {
  await page.getByTestId('username').fill('tester');
  await page.getByTestId('login-submit').click();

  await expect(page.getByTestId('login-error')).toHaveText(
    /아이디와 비밀번호를 모두 입력하세요./
  );

  await page.getByTestId('password').fill('qaground123');
  await page.getByTestId('login-submit').click();

  await expect(page.getByTestId('login-success')).toHaveText(
    /환영합니다, tester님. 로그인에 성공했습니다./
  );
  await expect(page.getByTestId('login-error')).not.toBeVisible();
});
`,
    notes: [
      '정상 로그인만 검증하면 실제 서비스에서 자주 깨지는 검증 메시지와 재시도 흐름을 놓칩니다.',
      'toHaveText는 요소가 기대 문구가 될 때까지 기다리므로 비동기 UI 검증에 적합합니다.',
    ],
  },
};

export function getChallengeSolution(slug: string): ChallengeSolution | undefined {
  return SOLUTIONS[slug];
}
