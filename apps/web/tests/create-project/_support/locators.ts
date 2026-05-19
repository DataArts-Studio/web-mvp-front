// 프로젝트 생성 모달의 모든 셀렉터를 한 곳에 모은다.
// 마크업이 바뀌면 이 파일만 고치면 모든 spec 이 따라간다.
// role/label 기반으로 작성해서 a11y 회귀도 같이 막아준다.
import type { Page } from '@playwright/test';

export function loc(page: Page) {
  // 생성 모달 자체는 id=create-project, role=dialog 로 지정되어 있음
  // (project-create-form.tsx 참고)
  const modal = page.locator('#create-project[role="dialog"]');

  return {
    landing: {
      openModalButton: page.getByRole('button', { name: '무료로 프로젝트 생성 시작하기' }),
    },
    modal,
    step1: {
      projectName: modal.getByLabel(/프로젝트 이름/),
      termsAgree: modal.getByRole('checkbox', { name: /이용약관/ }),
      ageConfirm: modal.getByRole('checkbox', { name: /만 14세 이상/ }),
      nextButton: modal.getByRole('button', { name: '프로젝트 생성 시작' }),
      // Step1 의 닫기는 모달 하단의 "돌아가기" 텍스트 버튼
      closeButton: modal.getByRole('button', { name: '돌아가기' }),
    },
    step2: {
      heading: modal.getByRole('heading', { name: '프라이빗 모드로 생성하기' }),
      identifier: modal.getByLabel(/^프로젝트 식별번호/),
      identifierConfirm: modal.getByLabel(/^식별번호 재확인/),
      nextButton: modal.getByRole('button', { name: '프로젝트 생성하기' }),
      closeButton: modal.getByRole('button', { name: '닫기' }),
      // 에러 메시지는 DsFormField.Message 가 <p data-invalid="true"> 로 렌더
      errorMessage: modal.locator('p[data-invalid="true"]'),
    },
    step3: {
      heading: modal.getByRole('heading', { name: '프로젝트를 생성하시겠습니까?' }),
      submitButton: modal.getByRole('button', { name: '생성하기' }),
      cancelButton: modal.getByRole('button', { name: '취소' }),
    },
    success: {
      heading: modal.getByRole('heading', { name: '프로젝트 생성 완료!' }),
      copyLinkButton: modal.getByRole('button', { name: /(링크 복사|복사 완료)/ }),
      copiedConfirm: modal.getByRole('button', { name: '복사 완료' }),
      startButton: modal.getByRole('button', { name: '시작하기' }),
    },
  };
}

export type Locators = ReturnType<typeof loc>;
