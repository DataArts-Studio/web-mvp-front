import { ACCESS_TEST_DATA as D } from '../../data/test-data';
import { expect, test } from '../../fixtures/test';
import { ProjectAccessPage } from '../../pages';

// rate-limit 카운터는 dev 서버 인메모리 Map(프로젝트+IP)에 공유된다.
// 이 파일은 "틀린 값" 제출을 validation 1건(<5회)만 하고, 골든패스 성공이
// 카운터를 비우므로 테스트 간 오염은 없다. 완전 락아웃(6회)은 격리 불가 → fixme.

test.describe('프로젝트 접근 - Golden path', () => {
  test('URL 직접 접근 → 식별번호 입력 → 대시보드 진입', async ({
    accessPage,
    dashboardPage,
  }) => {
    await accessPage.goto(D.slug);
    await accessPage.expectAtGate(D.slug);

    await accessPage.authenticate(D.validCode);

    await dashboardPage.expectLoaded(D.slug);
    await dashboardPage.expectSidebarVisible();
    await dashboardPage.expectProjectName(D.slug);
  });

  test('보호 라우트 직접 접근 → 게이트 리다이렉트 → 인증 → 원래 URL 복귀', async ({
    accessPage,
    dashboardPage,
  }) => {
    await accessPage.gotoProtected(`/projects/${D.slug}`);
    await accessPage.expectRedirectedFromProtected(
      D.slug,
      `/projects/${D.slug}`
    );

    await accessPage.authenticate(D.validCode);

    await dashboardPage.expectLoaded(D.slug);
  });

  test('인증된 세션은 재접근 시 게이트를 건너뛴다', async ({
    accessPage,
    dashboardPage,
  }) => {
    await accessPage.goto(D.slug);
    await accessPage.authenticate(D.validCode);
    await dashboardPage.expectLoaded(D.slug);

    // 같은 세션 보호 라우트 재진입 → 게이트 없이 대시보드
    await dashboardPage.goto(D.slug);
    await dashboardPage.expectLoaded(D.slug);

    // 같은 세션 access 직접 진입 → 대시보드로 리다이렉트
    await accessPage.goto(D.slug);
    await dashboardPage.expectLoaded(D.slug);
  });
});

test.describe('프로젝트 접근 - validation', () => {
  test.beforeEach(async ({ accessPage }) => {
    await accessPage.goto(D.slug);
  });

  test('빈 값 제출 시 입력 안내 메시지가 노출된다', async ({ accessPage }) => {
    await accessPage.submit();
    await accessPage.expectError(ProjectAccessPage.messages.required);
    await accessPage.expectAtGate(D.slug);
  });

  test('8자 미만 제출 시 길이 안내 메시지가 노출된다', async ({
    accessPage,
  }) => {
    await accessPage.authenticate(D.shortCode);
    await accessPage.expectError(ProjectAccessPage.messages.tooShort);
  });

  test('틀린 식별번호 제출 시 에러·잔여 횟수가 노출되고 입력값이 유지된다', async ({
    accessPage,
  }) => {
    await accessPage.authenticate(D.wrongCode);

    await accessPage.expectError(ProjectAccessPage.messages.wrongPassword);
    await accessPage.expectRemainingAttempts();
    expect(await accessPage.currentCode()).toBe(D.wrongCode);
  });
});

test.describe('프로젝트 접근 - redirect 쿼리 처리', () => {
  test('redirect 쿼리에 지정한 경로로 인증 후 이동한다', async ({
    accessPage,
    page,
  }) => {
    await accessPage.goto(D.slug, `/projects/${D.slug}/suites`);
    await accessPage.authenticate(D.validCode);

    await expect(page).toHaveURL(new RegExp(`/projects/${D.slug}/suites`));
  });

  test('open-redirect 시도는 기본 경로로 안전하게 우회된다', async ({
    accessPage,
    dashboardPage,
  }) => {
    await accessPage.goto(D.slug, '//evil.com');
    await accessPage.authenticate(D.validCode);

    await dashboardPage.expectLoaded(D.slug);
  });
});

test.describe('프로젝트 접근 - cancel(이탈)', () => {
  test('뒤로가기 후 재진입 시 입력값이 보존되지 않는다', async ({
    accessPage,
    page,
  }) => {
    // 테스트가 히스토리를 명시적으로 구성한다. (전역 fixture 네비게이션 없음)
    await page.goto('/');
    await accessPage.goto(D.slug);
    await accessPage.enterCode(D.validCode);

    await page.goBack();
    await expect(page).toHaveURL('/');

    await accessPage.goto(D.slug);
    expect(await accessPage.currentCode()).toBe('');
  });
});

// 인메모리 rate-limit / always-fail Turnstile 은 테스트에서 격리 불가 → placeholder.
test.describe('프로젝트 접근 - 차단 시나리오', () => {
  test.fixme('6회째 제출에서 rate-limit 차단 메시지가 노출된다', async ({
    accessPage,
  }) => {
    await accessPage.goto(D.slug);
    for (let i = 0; i < 5; i++) {
      await accessPage.authenticate(D.wrongCode);
      await accessPage.expectError(ProjectAccessPage.messages.wrongPassword);
    }
    await accessPage.authenticate(D.wrongCode);
    await accessPage.expectRateLimited();
  });

  test.fixme('Turnstile always-fail 환경에서 제출이 차단된다', async () => {
    // always-fail siteKey 환경 또는 런타임 토글 도입 후 작성
  });
});
