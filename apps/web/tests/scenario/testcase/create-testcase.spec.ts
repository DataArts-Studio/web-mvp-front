import {
  ACCESS_TEST_DATA as TEST_DATA,
  caseFactory,
} from '../../data/test-data';
import { test } from '../../fixtures/test';

test.describe('테스트 케이스 생성 시나리오', () => {
  test('작성한 테스트케이스가 목록에 반영된다.', async ({ testCasePage }) => {
    const testCaseTitle = caseFactory.uniqueTitle();

    await test.step('cases 페이지도 이동한다.', async () => {
      await testCasePage.goto(TEST_DATA.slug);
      await testCasePage.expectLoaded(TEST_DATA.slug);
    });

    await test.step('새로운 테스트 케이스 내용을 입력하고 제출한다.', async () => {
      await testCasePage.openCreateForm();
      await testCasePage.enterInput(testCaseTitle);
      await testCasePage.submit();
    });

    await test.step('생성된 테스트 케이스가 목록에 정상적으로 반영되었는지 확인한다.', async () => {
      await testCasePage.expectCaseInTable(testCaseTitle);
    });

    await test.step('새로고침해도 해당 테스트 케이스가 목록에 남아 있다.', async () => {
      await testCasePage.reload();
      await testCasePage.expectLoaded(TEST_DATA.slug);
      await testCasePage.expectCaseInTable(testCaseTitle);
    });
  });

  test('제목 미입력 제출 시 에러가 출력되고 폼이 유지된다.', async ({
    testCasePage,
  }) => {
    await testCasePage.goto(TEST_DATA.slug);
    await testCasePage.openCreateForm();
    await testCasePage.submit();
    await testCasePage.expectTitleRequiredError();
  });

  test('테스트케이스 작성 중 취소하면 데이터가 저장되지 않고 목록으로 돌아간다.', async ({
    testCasePage,
  }) => {
    const testCaseTitle = caseFactory.uniqueTitle();

    await test.step('테스트케이스 생성 폼을 열고 내용을 입력한다', async () => {
      await testCasePage.goto(TEST_DATA.slug);
      await testCasePage.openCreateForm();
      await testCasePage.enterInput(testCaseTitle);
    });

    await test.step('취소 버튼을 클릭한다.', async () => {
      await testCasePage.closeCreateForm();
    });

    await test.step('목록으로 돌아오고, 입력한 제목이 출력되지 않는다.', async () => {
      await testCasePage.expectPageVisible();
      await testCasePage.expectTestCaseNotInList(testCaseTitle);
    });
  });
});
