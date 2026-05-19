import { test } from '../../fixtures/test';

test.describe('프로젝트 생성 시나리오', () => {
  test('프로젝트 생성 완료 후 대시보드로 진입한다', async ({ landingPage }) => {
    await test.step('프로젝트 생성 모달을 연다.', async () => {});
    await test.step('[Step 1] 프로젝트 이름, 이용약관 동의 후 제출한다.', async () => {});
    await test.step('[Step 2] 식별번호, 재확인 입력 후 제출한다.', async () => {});
    await test.step('[Step 3] 입력한 프로젝트 정보가 출력되는지 확인 후 생성한다.', async () => {});
    await test.step('[Step 4] 생성한 프로젝트 대시보드로 이동한다.', async () => {});
  });

  test('Step1 필수 미입력 시 프로젝트 생성이 진행되지 않는다', async ({ landingPage }) => {
    await test.step('프로젝트 생성 모달을 연다.', async () => {});
    await test.step('[Step 1] 필수 항목을 비운 채 제출한다.', async () => {});
    await test.step('누락 항목별 인라인 에러가 노출되고 Step 1에 머문다.', async () => {});
    await test.step('[Step 1] 필수 항목을 모두 채워 제출하면 Step 2로 진행된다.', async () => {});
  });

  test('Step2 식별번호 불일치 시 프로젝트 생성이 진행되지 않는다', async ({ landingPage }) => {
    await test.step('프로젝트 생성 모달을 연다.', async () => {});
    await test.step('[Step 1] 프로젝트 이름, 이용약관 동의 후 제출한다.', async () => {});
    await test.step('[Step 2] 서로 다른 식별번호, 재확인 입력 후 제출한다.', async () => {});
    await test.step('식별번호 불일치 에러가 노출되고 Step 2에 머문다.', async () => {});
    await test.step('[Step 2] 식별번호를 동일하게 맞춰 제출하면 Step 3로 진행된다.', async () => {});
  });

  test('모달 바깥 클릭으로 이탈하면 프로젝트가 생성되지 않는다', async ({ landingPage }) => {
    await test.step('프로젝트 생성 모달을 연다.', async () => {});
    await test.step('[Step 1] 프로젝트 이름을 입력한다.', async () => {});
    await test.step('모달 바깥(backdrop)을 클릭한다.', async () => {});
    await test.step('모달이 닫히고 랜딩에 머문다.', async () => {});
    await test.step('모달을 다시 열면 Step 1부터 시작하고 입력값이 비어 있다.', async () => {});
  });

  test('취소/닫기 버튼으로 이탈하면 프로젝트가 생성되지 않는다', async ({ landingPage }) => {
    await test.step('프로젝트 생성 모달을 연다.', async () => {});
    await test.step('[Step 1] 프로젝트 이름, 이용약관 동의 후 제출한다.', async () => {});
    await test.step('[Step 2] 식별번호, 재확인 입력 후 제출한다.', async () => {});
    await test.step('[Step 3] 취소 버튼을 클릭한다.', async () => {});
    await test.step('모달이 닫히고 랜딩에 머문다.', async () => {});
    await test.step('모달을 다시 열면 Step 1부터 시작하고 입력값이 비어 있다.', async () => {});
  });
});
