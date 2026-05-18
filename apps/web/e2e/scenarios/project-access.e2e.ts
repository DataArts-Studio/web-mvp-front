import { expect, test } from '../share/utils';
import { ProjectAccessPage } from '../support/pages/project-access';

const SLUG = 'sample-project';
const VALID_CODE = '123123123';

test.describe('Golden path - 프로젝트 접근', () => {
  let access: ProjectAccessPage;

  test.beforeEach(async ({ page }) => {
    access = new ProjectAccessPage(page);
    await access.goto(SLUG);
  });

  test('올바른 식별번호 입력 시 대시보드로 이동한다', async ({ page }) => {
    await access.fillCode(VALID_CODE);
    await access.submit();

    await expect(page).toHaveURL(`/projects/${SLUG}`);
    await expect(page.getByRole('heading', { name: SLUG })).toBeVisible();
  });
});
