import { ACCESS_TEST_DATA as TEST_DATA, suiteFactory } from '../../data/test-data';
import { test } from '../../fixtures/test';

test.describe('테스트 스위트 생성 E2E 테스트', () => {
  test('작성한 테스트 스위트가 목록에 반영되고 새로고침 후에도 유지된다.', async ({ testSuitePage }) => {
    const suiteTitle = suiteFactory.uniqueTitle();

    await test.step('테스트 스위트 페이지로 이동한다.', async () => {
      await testSuitePage.goto(TEST_DATA.slug);
      await testSuitePage.expectLoaded(TEST_DATA.slug);
    });

    await test.step('생성 폼을 열고 제목을 입력한 뒤 제출한다.', async () => {
      await testSuitePage.openCreateForm();
      await testSuitePage.enterTitle(suiteTitle);
      await testSuitePage.submit();
    });

    await test.step('폼이 닫히고 생성된 스위트가 목록에 반영된다.', async () => {
      await testSuitePage.expectModalClosed();
      await testSuitePage.expectSuiteInList(suiteTitle);
    });

    await test.step('새로고침해도 해당 스위트가 목록에 남아 있다.', async () => {
      await testSuitePage.reload();
      await testSuitePage.expectLoaded(TEST_DATA.slug);
      await testSuitePage.expectSuiteInList(suiteTitle);
    });
  });

  test('작성 중 취소 버튼으로 이탈하면 저장되지 않고 목록에 반영되지 않는다.', async ({ testSuitePage }) => {
    const suiteTitle = suiteFactory.uniqueTitle();

    await test.step('생성 폼을 열고 제목을 입력한다.', async () => {
      await testSuitePage.goto(TEST_DATA.slug);
      await testSuitePage.expectLoaded(TEST_DATA.slug);
      await testSuitePage.openCreateForm();
      await testSuitePage.enterTitle(suiteTitle);
    });

    await test.step('취소 버튼을 클릭한다.', async () => {
      await testSuitePage.cancel();
    });

    await test.step('폼이 닫히고 입력한 제목이 목록에 없다.', async () => {
      await testSuitePage.expectModalClosed();
      await testSuitePage.expectSuiteNotInList(suiteTitle);
    });
  });

  test('작성 중 모달 바깥을 클릭해 이탈하면 저장되지 않고 목록에 반영되지 않는다.', async ({ testSuitePage }) => {
    const suiteTitle = suiteFactory.uniqueTitle();

    await test.step('생성 폼을 열고 제목을 입력한다.', async () => {
      await testSuitePage.goto(TEST_DATA.slug);
      await testSuitePage.expectLoaded(TEST_DATA.slug);
      await testSuitePage.openCreateForm();
      await testSuitePage.enterTitle(suiteTitle);
    });

    await test.step('모달 바깥(backdrop)을 클릭한다.', async () => {
      await testSuitePage.closeByBackdrop();
    });

    await test.step('폼이 닫히고 입력한 제목이 목록에 없다.', async () => {
      await testSuitePage.expectModalClosed();
      await testSuitePage.expectSuiteNotInList(suiteTitle);
    });
  });

  test('제목 미입력 또는 3자 미만이면 검증 에러가 노출되고 폼이 유지된다.', async ({ testSuitePage }) => {
    await test.step('테스트 스위트 페이지로 이동해 생성 폼을 연다.', async () => {
      await testSuitePage.goto(TEST_DATA.slug);
      await testSuitePage.expectLoaded(TEST_DATA.slug);
      await testSuitePage.openCreateForm();
    });

    await test.step('제목을 비운 채 제출하면 검증 에러가 노출되고 폼이 유지된다.', async () => {
      await testSuitePage.submit();
      await testSuitePage.expectTitleValidationError();
    });

    await test.step('제목을 3자 미만으로 입력해 제출해도 검증 에러가 노출되고 폼이 유지된다.', async () => {
      await testSuitePage.enterTitle('ab');
      await testSuitePage.submit();
      await testSuitePage.expectTitleValidationError();
    });
  });

  // 현 구현은 서버 실패를 성공으로 간주해 모달이 닫히고 에러 UI가 없음(scenario.md 구현 메모 참조).
  // mutation이 result.success를 검사하도록 수정되면 정식 test로 승격한다.
  test.fixme('서버 생성 실패 시 에러가 노출되고 폼이 유지된다.', async ({ testSuitePage }) => {});
});
