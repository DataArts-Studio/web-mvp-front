import { test, expect } from '../share/utils'
import { ProjectAccessPage } from '../support/pages/project-access';

test.describe('Golden path - 프로젝트 접근 시나리오', () => {
  let projectAccess: ProjectAccessPage;
  const BASE_URL = 'http://localhost:3000';

  // 페이지 접근
  test.beforeEach(async ({ page }) => {
    projectAccess = new ProjectAccessPage(page);
    await projectAccess.open('/');
  })
  // 식별번호 입력
  // 대시보드 접근
})