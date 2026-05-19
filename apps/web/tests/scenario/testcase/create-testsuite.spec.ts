import { ACCESS_TEST_DATA as TEST_DATA, caseFactory } from '../../data/test-data';
import { test } from '../../fixtures/test';

test.describe('테스트 스위트 생성 E2E 테스트', () => {
  test('작성한 테스트 스위트가 목록에 반영되고 새로고침 후에도 유지된다.', async ({ testCasePage }) => {});

  test('작성 중 취소 버튼으로 이탈하면 저장되지 않고 목록에 반영되지 않는다.', async ({ testCasePage }) => {});

  test('작성 중 모달 바깥을 클릭해 이탈하면 저장되지 않고 목록에 반영되지 않는다.', async ({ testCasePage }) => {});
})