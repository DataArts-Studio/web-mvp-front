import { test } from '../../fixtures/test';

test.describe('프로젝트 생성 시나리오', () => {
  test('프로젝트 생성 완료 후 대시보드로 진입한다', async ({ landingPage }) => {});

  test('Step1 필수 미입력 시 프로젝트 생성이 진행되지 않는다', async ({ landingPage }) => {});

  test('Step2 식별번호 불일치 시 프로젝트 생성이 진행되지 않는다', async ({ landingPage }) => {});

  test('모달 바깥 클릭으로 이탈하면 프로젝트가 생성되지 않는다', async ({ landingPage }) => {});

  test('취소/닫기 버튼으로 이탈하면 프로젝트가 생성되지 않는다', async ({ landingPage }) => {});
});
