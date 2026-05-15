import type { Page } from '@playwright/test';

export function projectSearchLoc(page: Page) {
  // 검색 모달은 id 가 없어서 role=dialog + accessible name(aria-labelledby)으로 식별.
  // project-search-modal.tsx 의 <div role="dialog" aria-labelledby="search-modal-title"> 참고.
  // 모달 밖 동명 요소와 섞이지 않도록 모달 내부 셀렉터는 modal 에서 체이닝한다.
  const modal = page.getByRole('dialog', { name: /내 프로젝트 찾기/ });

  return {
    landing: {
      openModalButton: page.getByRole('button', {
        name: '내 프로젝트 검색 모달 열기',
      }),
    },
    modal,
    step1: {
      // 모달 헤더의 X 버튼 (aria-label="닫기")
      closeModalButton: modal.getByRole('button', { name: '닫기' }),
      projectNameInput: modal.getByPlaceholder(/프로젝트명 입력.../),
      projectList: modal.getByRole('link', { name: /sample-project/ }),
      searchButton: modal.getByRole('button', { name: /^검색$/ }),
      heading: page.getByRole('heading', { name: 'sample-project' }),
      accessButton: page.getByRole('button', { name: /접속하기/ }),
      linkButton: page.getByRole('link', { name: /sample-project/ }),
    },
    success: {
      heading: page.getByRole('heading', { name: /프로젝트 접근/ }),
    },
  };
}
