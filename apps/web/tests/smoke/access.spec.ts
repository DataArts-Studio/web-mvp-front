/**
 * Smoke: 프로젝트 접근 (access)
 *
 * scenario/access/project-access.spec.ts 와 같은 도메인을 다루지만,
 * 의도가 다르다.
 *
 * scenario: 깊이. 검증 분기·redirect 쿼리·뒤로가기·rate-limit 등 도메인의
 *   "이 페이지가 정상 동작하는가"를 풍부하게 본다.
 * smoke   : 넓이. "이게 깨지면 사용자가 앱에 들어올 수 없다" 1~2개만 본다.
 *   PR 단계에서 빠르게 회귀를 잡는 목적이라 케이스 수와 단언 수를 의도적으로 줄인다.
 *
 * 선정 기준
 * - 골든패스 1: 식별번호 입력 → 대시보드 진입 (앱 진입의 99% 경로)
 * - 예외 1   : 틀린 식별번호 → 에러 메시지 + 입력값 유지
 *              (가장 흔히 깨지는 자리. rate-limit 카운터를 1만 증가시키므로
 *               같은 파일의 골든패스 성공이 카운터를 비워 테스트 간 오염 없음)
 *
 * 의도적으로 뺀 것
 * - 사이드바·프로젝트명 등 부가 단언 (scenario 가 본다)
 * - redirect 쿼리, open-redirect, 뒤로가기 보존, rate-limit 락아웃 (scenario)
 */
import { ACCESS_TEST_DATA as D } from '../data/test-data';
import { expect, test } from '../fixtures/test';
import { ProjectAccessPage } from '../pages';

test.describe('@smoke 프로젝트 접근', () => {
  test('식별번호 입력 후 대시보드에 도달한다', async ({
    accessPage,
    dashboardPage,
  }) => {
    await accessPage.goto(D.slug);
    await accessPage.authenticate(D.validCode);

    // 스모크는 "도달"만 본다. 페이지 내부 KPI/사이드바는 scenario 책임.
    await dashboardPage.expectLoaded(D.slug);
  });

  test('틀린 식별번호 제출 시 에러가 보이고 입력값이 유지된다', async ({
    accessPage,
  }) => {
    await accessPage.goto(D.slug);
    await accessPage.authenticate(D.wrongCode);

    await accessPage.expectError(ProjectAccessPage.messages.wrongPassword);
    expect(await accessPage.currentCode()).toBe(D.wrongCode);
  });
});
