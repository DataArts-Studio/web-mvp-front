# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: senarios\project-access.e2e.ts >> Golden path - 프로젝트 접근 >> 올바른 식별번호 입력 시 대시보드로 이동한다
- Location: e2e\senarios\project-access.e2e.ts:15:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected: "http://localhost:3000/projects/sample-project"
Received: "http://localhost:3000/projects/sample-project/access"
Timeout:  5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    14 × unexpected value "http://localhost:3000/projects/sample-project/access"

```

```yaml
- link:
  - /url: /
  - img
- heading "프로젝트 접근" [level=1]
- paragraph: sample-project 프로젝트에 접근하려면 비밀번호를 입력해주세요.
- text: 프로젝트 비밀번호 (식별번호)
- textbox "프로젝트 비밀번호 (식별번호)":
  - /placeholder: 8~16자리 비밀번호 입력
- button
- paragraph: 비밀번호를 입력해주세요.
- button "접근하기"
- paragraph: 프로젝트 생성 시 설정한 식별번호를 입력해주세요. 비밀번호를 잊으셨다면 프로젝트 관리자에게 문의해주세요.
- alert
- region "Notifications alt+T"
```

# Test source

```ts
  1  | import { expect, test } from '../share/utils';
  2  | import { ProjectAccessPage } from '../support/pages/project-access';
  3  | 
  4  | const SLUG = 'sample-project';
  5  | const VALID_CODE = '123123123';
  6  | 
  7  | test.describe('Golden path - 프로젝트 접근', () => {
  8  |   let access: ProjectAccessPage;
  9  | 
  10 |   test.beforeEach(async ({ page }) => {
  11 |     access = new ProjectAccessPage(page);
  12 |     await access.goto(SLUG);
  13 |   });
  14 | 
  15 |   test('올바른 식별번호 입력 시 대시보드로 이동한다', async ({ page }) => {
  16 |     await access.fillCode(VALID_CODE);
  17 |     await access.submit();
  18 | 
> 19 |     await expect(page).toHaveURL(`/projects/${SLUG}`);
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  20 |     await expect(page.getByRole('heading', { name: SLUG })).toBeVisible();
  21 |   });
  22 | });
  23 | 
```