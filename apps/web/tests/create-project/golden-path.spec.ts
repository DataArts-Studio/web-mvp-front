// 행복경로(Happy Path) 전체.
// 사전조건:
// - apps/web dev 또는 production 빌드 실행 중 (http://localhost:3000)
// - localhost 환경은 Turnstile siteKey 가 빈 문자열로 처리되어 위젯 미렌더 (봇 검증 자동 통과)
//   project-create-form.tsx 의 isLocalhost 분기 참고.
import { test, expect } from '../share/utils';
import { loc } from './_support/locators';
import { openModal } from './_support/flows';

// 클립보드 검증을 위해 권한 부여 (StepSuccess 의 navigator.clipboard.writeText)
test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

// Golden Path는 플로우 자체가 검증 대상이라서 헬퍼로 감추면 안 됨
// 프로젝트 생성은 이렇게 진행된다 가 한눈에 보여야 함.
test.describe('프로젝트 생성 - Golden Path', () => {
  test('[Golden Path] 전체 흐름이 끝까지 성공한다', async ({ page }) => {
    const l = loc(page);
    const projectName = `e2e-${Date.now()}`;
    const identifier = 'Pass1234!';

    await test.step('모달 진입', async () => {
      await openModal(page);
    });

    await test.step('Step1: 프로젝트 이름 입력', async () => {
      await l.step1.projectName.fill(projectName);
      await expect(l.step1.projectName).toHaveValue(projectName);
    });

    await test.step('Step1: 필수 동의항목 체크', async () => {
      await l.step1.termsAgree.check();
      await l.step1.ageConfirm.check();
      await expect(l.step1.termsAgree).toBeChecked();
      await expect(l.step1.ageConfirm).toBeChecked();
    });

    await test.step('Step1 → Step2 진입', async () => {
      await l.step1.nextButton.click();
      await expect(l.step2.heading).toBeVisible();
      await expect(l.step2.identifier).toBeVisible();
    });

    await test.step('Step2: 식별번호 입력 (재입력 일치)', async () => {
      await l.step2.identifier.fill(identifier);
      await l.step2.identifierConfirm.fill(identifier);
      await expect(l.step2.identifier).toHaveValue(identifier);
      await expect(l.step2.identifierConfirm).toHaveValue(identifier);
    });

    await test.step('Step2 → Step3 진입', async () => {
      await l.step2.nextButton.click();
      await expect(l.step3.heading).toBeVisible();
      // localhost 에서는 Turnstile 미렌더 → 생성하기 버튼이 즉시 enabled
      await expect(l.step3.submitButton).toBeEnabled();
    });

    await test.step('Step3: 생성하기 → 성공 step 진입', async () => {
      await l.step3.submitButton.click();
      // 서버 액션 응답 대기. expect 의 auto-retry 가 처리.
      await expect(l.success.heading).toBeVisible({ timeout: 15_000 });
    });

    await test.step('링크 복사 → 클립보드에 프로젝트 URL', async () => {
      await l.success.copyLinkButton.click();
      await expect(l.success.copiedConfirm).toBeVisible(); // UI 피드백

      const clipboard = await page.evaluate(() => navigator.clipboard.readText());
      // step-success.tsx 가 window.location.origin 기준으로 링크를 만든다.
      // baseURL 이 staging/prod 으로 바뀌어도 동일 검증이 가능하도록 origin 동적 계산.
      const origin = await page.evaluate(() => window.location.origin);
      expect(clipboard).toBe(`${origin}/projects/${encodeURIComponent(projectName)}`);
    });

    await test.step('시작하기 → 프로젝트 대시보드로 이동', async () => {
      await l.success.startButton.click();
      // dev 서버는 동적 라우트 첫 컴파일이 느려 timeout 여유 필요
      await expect(page).toHaveURL(
        new RegExp(`/projects/${encodeURIComponent(projectName)}(/.*)?$`),
        { timeout: 30_000 },
      );
      await expect(page.getByText(projectName).first()).toBeVisible({
        timeout: 15_000,
      });
    });
  });
});
