/*
## cancel - 이탈 시나리오
### 검색모달 닫기
- 닫기 버튼(x)을 클릭하면 모달이 닫히고 랜딩페이지에 머무른다.
- ESC 키를 입력하면 모달이 닫힌다.
- 모달 외부 화면을 클릭하면 모달이 닫힌다.*/
import { expect, test } from '../share/utils';
import { openModal } from './_support/flows';
import { projectSearchLoc } from './_support/locators';

test.describe('프로젝트 검색중 이탈 시나리오', () => {
  test('X 버튼 클릭 시 모달이 닫힌다', async ({ page }) => {
    const loc = projectSearchLoc(page);
    await openModal(page);
    await loc.step1.closeModalButton.click();
    await expect(loc.modal).toBeHidden();
  });

  test('모달 외부 클릭으로 닫힌다.', async ({ page }) => {
    const loc = projectSearchLoc(page);
    await openModal(page);
    await page.mouse.click(10, 10);
    await expect(loc.modal).toBeHidden();
  });

  test('ESC 입력으로 모달이 종료된다.', async ({ page }) => {
    const loc = projectSearchLoc(page);
    await openModal(page);
    await page.keyboard.press('Escape');
    await expect(loc.modal).toBeHidden();
  });
});
