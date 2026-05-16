import type { Page } from '@playwright/test';

/**
 * ProjectAccessPage 의 locator 정의.
 *
 * POM 클래스에서 셀렉터 자체를 분리해 둠으로써
 * - 마크업 변경 시 locator 파일만 수정하면 됨
 * - POM 메서드는 "동작" 에만 집중
 * - spec 에서도 필요 시 직접 import 해서 일회성 단언 가능
 *
 * @see project-access.ts (POM)
 */
export function projectAccessLoc(page: Page) {
  return {
    codeInput: page.getByRole('textbox', { name: '식별번호' }),
    submitButton: page.getByRole('button', { name: '접근하기' }),
    errorAlert: page.getByRole('alert'),
    blockedNotice: page.getByText(/차단되었습니다/),
    backToHomeButton: page.getByRole('link', { name: '메인페이지 이동' }),
  };
}

export type ProjectAccessLoc = ReturnType<typeof projectAccessLoc>;
