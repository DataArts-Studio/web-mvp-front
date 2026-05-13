// 사전조건
// - Turnstile always-pass 키 설정됨 (.env.local)
// - apps/web production 빌드로 실행 (pnpm start)
// - 새 프로젝트 이름은 매 실행 고유 (timestamp prefix)
// 테스트 시나리오
// 1. 메인페이지 접근
// 2. 화면 중앙에 무료로 시작하기 클릭
// 3. 프로젝트 생성모달
// 3.1. 프로젝트 이름 입력
// 3.2. 필수 동의항목 체크
// 3.3. 프로젝트 생성 클릭
// 3.4. 프로젝트 식별번호 입력
// 3.5. 프로젝트 식별번호 재입력
// 3.6. 봇방지 체크 확인
// 3.7. (종료) 취소 버튼 클릭
// 3.8. 확인버튼 클릭시 프로젝트 생성됨
// 3.9. 링크 복사 클릭시 프로젝트 URL이 복사됨
// 3.10. 확인버튼 클릭시 대시보드로 이동
import { expect, test } from '@playwright/test';

test.describe('프로젝트 생성 시나리오', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('[Golden Path] 프로젝트 생성 성공', async ({ page }) => {
    await test.step('메인 페이지 접근', async () => {
      // 이미 beforeEach에서 처리했으므로 page.goto 생략
      await expect(page.getByRole('button', { name: /무료로.*시작하기/ })).toBeVisible();
    });

    await test.step('버튼 클릭시 프로젝트 생성모달이 출력된다', async () => {
      await page.getByRole('button', { name: /무료로 시작하기/ }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
    });

    await test.step('프로젝트 이름 입력', async () => {});
    await test.step('필수 동의항목 체크', async () => {});
    await test.step('프로젝트 생성 클릭', async () => {});
    await test.step('프로젝트 식별번호 입력', async () => {});
    await test.step('확인버튼 클릭시 프로젝트 생성됨', async () => {});
    await test.step('링크 복사 클릭시 프로젝트 URL이 복사됨', async () => {});
    await test.step('확인버튼 클릭시 대시보드로 이동', async () => {});
  });

  test('[Step1] 프로젝트 생성 취소', async ({ page }) => {});

  test('[Step2] 프로젝트 생성 취소', async ({ page }) => {});

  test('[Step3] 프로젝트 생성 취소', async ({ page }) => {});

  test.describe('Step1 Validation', () => {
    test('', async () => {});
  });

  test.describe('Step2 Validation', () => {
    test('', async () => {});
  });

  test.describe('Step3 Validation', () => {
    test('', async () => {});
  });

  test('이미 프로젝트가 있는 상태에서 추가생성', async ({ page }) => {});
});
