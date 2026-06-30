import 'server-only';

import type { ChallengeSolution } from './solution-types';

const SOLUTIONS: Record<string, ChallengeSolution> = {
  'rest-api-products': {
    approach: [
      '엔드포인트별로 pm.sendRequest를 분리해 목록, 상세, 404, 로그인, 생성, 삭제 흐름을 각각 검증합니다.',
      '상태 코드는 res.code로 먼저 확인하고, JSON 응답이 있는 경우에만 res.json()으로 본문 필드를 검증합니다.',
      '인증이 필요한 상품 생성과 삭제 요청에는 Authorization 헤더를 포함해 실제 보호 API 흐름을 검증합니다.',
      '204 응답은 본문이 없으므로 res.json()을 호출하지 않고 상태 코드만 검증합니다.',
    ],
    code: `const baseUrl = '/api/practice';
const token = 'qaground-demo-token';

pm.sendRequest(
  { url: baseUrl + '/products?page=1&limit=5', method: 'GET' },
  (err, res) => {
    pm.test('상품 목록은 200과 페이지 메타데이터를 반환한다', () => {
      pm.expect(err).to.eql(null);
      pm.expect(res.code).to.eql(200);

      const json = res.json();
      pm.expect(json.page).to.eql(1);
      pm.expect(json.limit).to.eql(5);
      pm.expect(json.total).to.eql(12);
      pm.expect(json.totalPages).to.eql(3);
      pm.expect(json.data.length).to.eql(5);
    });
  }
);

pm.sendRequest(
  { url: baseUrl + '/products/1', method: 'GET' },
  (err, res) => {
    pm.test('상품 상세는 200과 상품 필드를 반환한다', () => {
      pm.expect(err).to.eql(null);
      pm.expect(res.code).to.eql(200);

      const json = res.json();
      pm.expect(json.id).to.eql(1);
      pm.expect(json.name).to.eql('무선 키보드');
      pm.expect(json.category).to.eql('주변기기');
      pm.expect(json.price).to.eql(39000);
      pm.expect(json.inStock).to.eql(true);
    });
  }
);

pm.sendRequest(
  { url: baseUrl + '/products/9999', method: 'GET' },
  (err, res) => {
    pm.test('존재하지 않는 상품은 404를 반환한다', () => {
      pm.expect(err).to.eql(null);
      pm.expect(res.code).to.eql(404);

      const json = res.json();
      pm.expect(json.error).to.eql('상품을 찾을 수 없습니다.');
    });
  }
);

pm.sendRequest(
  {
    url: baseUrl + '/auth/login',
    method: 'POST',
    header: { 'Content-Type': 'application/json' },
    body: {
      mode: 'raw',
      raw: JSON.stringify({
        email: 'tester@qaground.dev',
        password: 'qaground123',
      }),
    },
  },
  (err, res) => {
    pm.test('로그인은 200과 토큰을 반환한다', () => {
      pm.expect(err).to.eql(null);
      pm.expect(res.code).to.eql(200);

      const json = res.json();
      pm.expect(json.token).to.eql(token);
      pm.expect(json.user.email).to.eql('tester@qaground.dev');
    });
  }
);

pm.sendRequest(
  {
    url: baseUrl + '/products',
    method: 'POST',
    header: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
    },
    body: {
      mode: 'raw',
      raw: JSON.stringify({
        name: '테스트 상품',
        price: 12000,
        category: '기타',
      }),
    },
  },
  (err, res) => {
    pm.test('상품 생성은 201과 생성된 상품을 반환한다', () => {
      pm.expect(err).to.eql(null);
      pm.expect(res.code).to.eql(201);

      const json = res.json();
      pm.expect(json.name).to.eql('테스트 상품');
      pm.expect(json.price).to.eql(12000);
      pm.expect(json.category).to.eql('기타');
    });
  }
);

pm.sendRequest(
  {
    url: baseUrl + '/products/1',
    method: 'DELETE',
    header: { Authorization: 'Bearer ' + token },
  },
  (err, res) => {
    pm.test('상품 삭제는 204를 반환한다', () => {
      pm.expect(err).to.eql(null);
      pm.expect(res.code).to.eql(204);
    });
  }
);
`,
    notes: [
      'Postman 테스트 스크립트에서는 request.get 같은 Playwright 문법 대신 pm.sendRequest를 사용합니다.',
      '여러 엔드포인트를 검증하는 문제는 하나의 제출 스크립트 안에 요청별 pm.sendRequest 블록을 나눠 작성합니다.',
      '본문이 없는 204 응답에서는 JSON 파싱을 하지 않는 것이 안정적입니다.',
    ],
  },
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

