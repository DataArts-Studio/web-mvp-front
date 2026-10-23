import { describe, expect, it } from 'vitest';

import { validateSpecAgainstSnapshot } from './validate-spec';

// 운영 랜딩(main) ariaSnapshot 일부. 러너 /capture 가 돌려주는 형식 그대로다.
const SNAPSHOT = `- main "메인 콘텐츠":
  - region "테스트 케이스 작성, 단 5분이면 끝.":
    - heading "테스트 케이스 작성, 단 5분이면 끝." [level=1]
    - paragraph: 말로만 들으면 잘 와닿지 않죠.
    - group "시작하기":
      - button "무료로 프로젝트 생성 시작하기": 무료로 시작하기
      - link "직접 확인해 보기":
        - /url: "#run"`;

const wrap = (body: string) =>
  `import { test, expect } from '@playwright/test';\ntest('t', async ({ page }) => {\n  await page.goto('/');\n${body}\n});`;

describe('validateSpecAgainstSnapshot', () => {
  it('트리에 있는 role/name 만 쓰면 문제가 없다.', () => {
    const spec = wrap(`
  await expect(page.getByRole('heading', { name: '테스트 케이스 작성', level: 1 })).toBeVisible({ timeout: 30000 });
  await page.getByRole('button', { name: '무료로 프로젝트 생성' }).click();`);
    expect(validateSpecAgainstSnapshot(spec, SNAPSHOT)).toEqual([]);
  });

  it('트리에 없는 name 을 추측하면 잡는다.', () => {
    const spec = wrap(
      `  await expect(page.getByRole('region', { name: '푸터 영역' })).toBeVisible();`
    );
    const issues = validateSpecAgainstSnapshot(spec, SNAPSHOT);
    expect(issues).toHaveLength(1);
    expect(issues[0].reason).toContain('푸터 영역');
  });

  it('트리에 없는 role 을 잡는다.', () => {
    const spec = wrap(`  await expect(page.getByRole('row').first()).toBeVisible();`);
    expect(validateSpecAgainstSnapshot(spec, SNAPSHOT)[0].reason).toContain('row');
  });

  it('exact: true 면 부분 일치를 허용하지 않는다.', () => {
    const spec = wrap(
      `  await page.getByRole('link', { name: '직접 확인', exact: true }).click();`
    );
    expect(validateSpecAgainstSnapshot(spec, SNAPSHOT)).toHaveLength(1);
  });

  it('첫 상호작용 뒤에 나타나는 요소는 검사하지 않는다.', () => {
    const spec = wrap(`
  await page.getByRole('button', { name: '무료로 프로젝트 생성 시작하기' }).click();
  await expect(page.getByRole('dialog', { name: '프로젝트 생성' })).toBeVisible();`);
    expect(validateSpecAgainstSnapshot(spec, SNAPSHOT)).toEqual([]);
  });

  it('getByText 는 트리 전체 텍스트와 대조한다.', () => {
    expect(
      validateSpecAgainstSnapshot(
        wrap(`  await expect(page.getByText('잘 와닿지 않죠')).toBeVisible();`),
        SNAPSHOT
      )
    ).toEqual([]);
    expect(
      validateSpecAgainstSnapshot(
        wrap(`  await expect(page.getByText('없는 문구')).toBeVisible();`),
        SNAPSHOT
      )
    ).toHaveLength(1);
  });

  it('정규식 name 처럼 정적으로 판단할 수 없는 인자는 건너뛴다.', () => {
    const spec = wrap(
      `  await expect(page.getByRole('heading', { name: /없는 제목/ })).toBeVisible();`
    );
    expect(validateSpecAgainstSnapshot(spec, SNAPSHOT)).toEqual([]);
  });
});
