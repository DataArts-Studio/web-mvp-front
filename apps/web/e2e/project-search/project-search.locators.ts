import type { Page } from '@playwright/test';

export function projectSearchLoc(page: Page) {
  return {
    landing: {
      goto: () => page.goto('http://localhost:3000'),
      closeDialog: {
        dismissDbOutageModal: () =>
          page
            .getByLabel('서비스 이용 불편 안내')
            .getByRole('button', { name: '확인' })
            .click(),
        dismissBetaModal: () =>
          page
            .getByLabel('Testea 베타 버전 안내')
            .getByRole('button', { name: '확인' })
            .click(),
      },
    },
    step1: {
      openButton: page.getByRole('button', {
        name: '내 프로젝트 검색 모달 열기',
      }),
      heading: page.getByRole('dialog', { name: /내 프로젝트 찾기/ }),
    },
    step2: {
      projectNameInput: page.getByPlaceholder(/프로젝트명 입력.../),
      projectList: page.getByRole('link', { name: /sample-project/ }),
      searchButton: page.getByRole('button', { name: /^검색$/ }),
      heading: page.getByRole('heading', { name: 'sample-project' }),
      accessButton: page.getByRole('button', { name: /접속하기/ }),
    },
    step3: {
      linkButton: page.getByRole('link', { name: /sample-project/ }),
      heading: page.getByRole('heading', { name: /프로젝트 접근/ }),
    },
    step4: {
      passwordInput: page.getByPlaceholder(/8~16자리 비밀번호 입력/),
      identifier: page.getByRole('button', { name: '접근하기' }),
      heading: page.getByLabel('대시보드'),
    },
  };
}
