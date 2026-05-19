import { ACCESS_TEST_DATA as TEST_DATA, caseFactory } from '../../data/test-data';
import { test } from '../../fixtures/test';

test.describe('테스트 스위트 생성 E2E 테스트', () => {
  test('작성한 테스트 스위트가 목록에 반영되고 새로고침 후에도 유지된다.', async ({ testCasePage }) => {});

  test('작성 중 취소 버튼으로 이탈하면 저장되지 않고 목록에 반영되지 않는다.', async ({ testCasePage }) => {});

  test('작성 중 모달 바깥을 클릭해 이탈하면 저장되지 않고 목록에 반영되지 않는다.', async ({ testCasePage }) => {});

  test('제목 미입력 또는 3자 미만이면 검증 에러가 노출되고 폼이 유지된다.', async ({ testCasePage }) => {});

  // 현 구현은 서버 실패를 성공으로 간주해 모달이 닫히고 에러 UI가 없음(scenario.md 구현 메모 참조).
  // mutation이 result.success를 검사하도록 수정되면 정식 test로 승격한다.
  test.fixme('서버 생성 실패 시 에러가 노출되고 폼이 유지된다.', async ({ testCasePage }) => {});
})