/*
## 사전조건
- 검색 가능한 프로젝트가 1개 이상 존재
- localhost: Turnstile siteKey 빈 문자열 → 위젯 미렌더 (봇 검증 자동 통과)
- preview/prod 자동화: always-pass 테스트 키 적용 → 골든패스가 위젯 통과까지 자연 검증

## Golden path - 부분 키워드 검색 → 리스트에서 선택 → 인증 → 대시보드
- 랜딩 페이지에서  내 프로젝트 찾기 버튼을 클릭한다.
- 검색 모달이 출력된다.
- 부분 키워드 입력
- 결과 리스트에 해당 프로젝트가 출력된다.
- 결과리스트에서 프로젝트를 클릭한다.
- 식별번호 입력 페이지로 이동한다.
- 올바른 식별번호를 입력하고 제출한다.
- 프로젝트 대시보드로 리디렉트되고 프로젝트 이름이 페이지에 출력된다.*/
import { expect, test } from '@playwright/test';

test.describe('[Golden Path] 프로젝트 검색', () => {
  test('[Golden Path] 부분 키워드를 검색했을때 전체 흐름이 끝까지 성공한다', async ({
    page,
  }) => {
    // 페이지 열기
    await page.goto('http://localhost:3000');
    await page
      .getByLabel('서비스 이용 불편 안내')
      .getByRole('button', { name: '확인' })
      .click();
    await page
      .getByLabel('Testea 베타 버전 안내')
      .getByRole('button', { name: '확인' })
      .click();

    await test.step('랜딩 페이지에서  내 프로젝트 찾기 버튼을 클릭한다.', async () => {
      await page
        .getByRole('button', { name: '내 프로젝트 검색 모달 열기' })
        .click();

      await expect(
        page.getByRole('dialog', { name: /내 프로젝트 찾기/ })
      ).toBeVisible();
    });

    await test.step('부분 키워드를 입력한다', async () => {
      await page.getByPlaceholder(/프로젝트명 입력.../).fill('sample');
      await expect(
        page.getByRole('link', { name: /sample-project/ })
      ).toBeVisible();
    });

    await test.step('결과 리스트에서 프로젝트를 클릭한다.', async () => {
      await page.getByRole('link', { name: /sample-project/ }).click();
      await expect(page.getByRole('heading', { name: /프로젝트 접근/ })).toBeVisible();

    });

    await test.step('올바른 식별번호를 입력하고 제출한다.', async () => {
      await page.getByPlaceholder(/8~16자리 비밀번호 입력/).fill('123123123');
      await page.getByRole('button', { name: '접근하기' }).click();
      await expect(page.getByLabel('대시보드')).toBeVisible();
      await expect(page).toHaveURL(/\projects\/sample-project/);
    });
  });
});
