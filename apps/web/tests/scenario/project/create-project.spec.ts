import { test } from '../../fixtures/test';

/**
 * 프로젝트 생성 E2E (scenario/project/scenario.md 기준).
 *
 * - 비인증 플로우 → playwright.config 의 `chromium`(미인증) 프로젝트에
 *   `**\/scenario/project/**\/*.spec.ts` 가 testMatch 로 포함돼야 한다.
 * - 골든패스는 실제 프로젝트 row 를 생성한다. teardown 미구현 + 베타 "프로젝트
 *   최대 1개" 제약이 있어, 매 실행 고유 이름으로 충돌만 회피한다(레거시 동일).
 * - 모달 본체/단계 헤딩/에러/닫기/성공은 LandingPage POM 이 소유한다.
 *   스펙은 로케이터를 직접 만지지 않고 시맨틱 메서드만 호출한다.
 */

// StepSuccess 의 navigator.clipboard.writeText 검증용 권한.
test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

test.describe('프로젝트 생성 시나리오', () => {
  test('프로젝트 생성 완료 후 대시보드로 진입한다', async ({ landingPage }) => {
    const projectName = `e2e-${Date.now()}`;
    const identifier = 'Pass1234!';

    await test.step('프로젝트 생성 모달을 연다.', async () => {
      await landingPage.goto();
      await landingPage.openModal();
      await landingPage.expectModalOpen();
    });

    await test.step('[Step 1] 프로젝트 이름, 이용약관 동의 후 제출한다.', async () => {
      await landingPage.enterTitle(projectName);
      await landingPage.checkTerms();
      await landingPage.checkPrivacy();
      await landingPage.submitStepOneButton();
      await landingPage.expectStep2();
    });

    await test.step('[Step 2] 식별번호, 재확인 입력 후 제출한다.', async () => {
      await landingPage.enterIdentifier(identifier);
      await landingPage.submitStepTwoButton();
      await landingPage.expectStep3();
      await landingPage.expectCreateEnabled();
    });

    await test.step('[Step 3] 입력한 프로젝트 정보가 출력되는지 확인 후 생성한다.', async () => {
      await landingPage.expectProjectNameInModal(projectName);
      await landingPage.submitCreate();
      await landingPage.expectSuccess();
    });

    await test.step('[Step 4] 생성한 프로젝트 대시보드로 이동한다.', async () => {
      await landingPage.copyProjectUrl();
      await landingPage.expectCopiedProjectUrl(projectName);
      await landingPage.goToDashboard();
      await landingPage.expectDashboardLoaded(projectName);
    });
  });

  test('Step1 필수 미입력 시 프로젝트 생성이 진행되지 않는다', async ({ landingPage }) => {
    await test.step('프로젝트 생성 모달을 연다.', async () => {
      await landingPage.goto();
      await landingPage.openModal();
      await landingPage.expectModalOpen();
    });

    await test.step('[Step 1] 필수 항목을 비운 채 제출한다.', async () => {
      await landingPage.submitStepOneButton();
    });

    await test.step('누락 항목별 인라인 에러가 노출되고 Step 1에 머문다.', async () => {
      await landingPage.expectStayedOnStep1();
    });

    await test.step('[Step 1] 필수 항목을 모두 채워 제출하면 Step 2로 진행된다.', async () => {
      await landingPage.enterTitle(`e2e-${Date.now()}`);
      await landingPage.checkTerms();
      await landingPage.checkPrivacy();
      await landingPage.submitStepOneButton();
      await landingPage.expectStep2();
    });
  });

  test('Step2 식별번호 불일치 시 프로젝트 생성이 진행되지 않는다', async ({ landingPage }) => {
    const identifier = 'Pass1234!';

    await test.step('프로젝트 생성 모달을 연다.', async () => {
      await landingPage.goto();
      await landingPage.openModal();
      await landingPage.expectModalOpen();
    });

    await test.step('[Step 1] 프로젝트 이름, 이용약관 동의 후 제출한다.', async () => {
      await landingPage.enterTitle(`e2e-${Date.now()}`);
      await landingPage.checkTerms();
      await landingPage.checkPrivacy();
      await landingPage.submitStepOneButton();
      await landingPage.expectStep2();
    });

    await test.step('[Step 2] 서로 다른 식별번호, 재확인 입력 후 제출한다.', async () => {
      await landingPage.enterIdentifier(identifier, 'Different1!');
      await landingPage.submitStepTwoButton();
    });

    await test.step('식별번호 불일치 에러가 노출되고 Step 2에 머문다.', async () => {
      await landingPage.expectIdentifierMismatch();
    });

    await test.step('[Step 2] 식별번호를 동일하게 맞춰 제출하면 Step 3로 진행된다.', async () => {
      await landingPage.enterIdentifier(identifier);
      await landingPage.submitStepTwoButton();
      await landingPage.expectStep3();
    });
  });

  test('모달 바깥 클릭으로 이탈하면 프로젝트가 생성되지 않는다', async ({ landingPage }) => {
    await test.step('프로젝트 생성 모달을 연다.', async () => {
      await landingPage.goto();
      await landingPage.openModal();
      await landingPage.expectModalOpen();
    });

    await test.step('[Step 1] 프로젝트 이름을 입력한다.', async () => {
      await landingPage.enterTitle(`e2e-${Date.now()}`);
    });

    await test.step('모달 바깥(backdrop)을 클릭한다.', async () => {
      await landingPage.closeByBackdrop();
    });

    await test.step('모달이 닫히고 랜딩에 머문다.', async () => {
      await landingPage.expectModalClosed();
      await landingPage.expectLoaded();
    });

    await test.step('모달을 다시 열면 Step 1부터 시작하고 입력값이 비어 있다.', async () => {
      await landingPage.openModal();
      await landingPage.expectModalOpen();
      await landingPage.expectTitleEmpty();
    });
  });

  test('취소/닫기 버튼으로 이탈하면 프로젝트가 생성되지 않는다', async ({ landingPage }) => {
    const identifier = 'Pass1234!';

    await test.step('프로젝트 생성 모달을 연다.', async () => {
      await landingPage.goto();
      await landingPage.openModal();
      await landingPage.expectModalOpen();
    });

    await test.step('[Step 1] 프로젝트 이름, 이용약관 동의 후 제출한다.', async () => {
      await landingPage.enterTitle(`e2e-${Date.now()}`);
      await landingPage.checkTerms();
      await landingPage.checkPrivacy();
      await landingPage.submitStepOneButton();
      await landingPage.expectStep2();
    });

    await test.step('[Step 2] 식별번호, 재확인 입력 후 제출한다.', async () => {
      await landingPage.enterIdentifier(identifier);
      await landingPage.submitStepTwoButton();
      await landingPage.expectStep3();
    });

    await test.step('[Step 3] 취소 버튼을 클릭한다.', async () => {
      await landingPage.cancelStep3();
    });

    await test.step('모달이 닫히고 랜딩에 머문다.', async () => {
      await landingPage.expectModalClosed();
      await landingPage.expectLoaded();
    });

    await test.step('모달을 다시 열면 Step 1부터 시작하고 입력값이 비어 있다.', async () => {
      await landingPage.openModal();
      await landingPage.expectModalOpen();
      await landingPage.expectTitleEmpty();
    });
  });
});
