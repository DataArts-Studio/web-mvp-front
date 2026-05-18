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
import { expect, test } from '../share/utils';
import { openModal } from './_support/flows';
import { projectSearchLoc } from './_support/locators';

test.describe('프로젝트 검색 - Golden Path', () => {
  test('부분 키워드로 검색하면 결과에서 선택해 대시보드까지 도달한다.', async ({
    page,
  }) => {
    const loc = projectSearchLoc(page);

    await test.step('내 프로젝트 찾기 모달을 연다.', async () => {
      await openModal(page);
    });

    await test.step('부분 키워드를 입력하고 결과 리스트를 확인한다.', async () => {
      await loc.step1.projectNameInput.fill('sample');
      await expect(loc.step1.projectList).toBeVisible();
    });

    await test.step('결과 리스트에서 프로젝트를 클릭한다.', async () => {
      await loc.step1.linkButton.click();
      await expect(page).toHaveURL(/\/projects\/sample-project\/access$/);
      await expect(loc.success.heading).toBeVisible();
    });
  });

  test('정확한 이름으로 검색하면 검색 버튼 제출로 대시보드까지 도달한다.', async ({
    page,
  }) => {
    const loc = projectSearchLoc(page);

    await test.step('내 프로젝트 찾기 모달을 연다.', async () => {
      await openModal(page);
    });

    await test.step('정확한 이름으로 검색하고 접속하기를 클릭한다.', async () => {
      await loc.step1.projectNameInput.fill('sample-project');
      await loc.step1.searchButton.click();
      await expect(loc.step1.heading).toBeVisible();
      await loc.step1.accessButton.click();
      await expect(page).toHaveURL(/\/projects\/sample-project\/access$/);
      await expect(loc.success.heading).toBeVisible();
    });
  });
});
