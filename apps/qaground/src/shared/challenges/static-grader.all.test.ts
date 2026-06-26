import { describe, expect, it } from 'vitest';

import { CHALLENGES, type Challenge } from './registry';
import { gradeSubmissionStatically } from './static-grader';

// 채점 라우트(/api/challenges/[slug]/run)는 sandboxSlug 있는 챌린지만 처리한다.
const sandboxChallenges = CHALLENGES.filter((c) => c.sandboxSlug);

function goodSubmission(c: Challenge): string {
  const ids = (c.selectors ?? []).map((s) => s.testid);
  const a = ids[0] ?? 'root';
  const b = ids[1] ?? a;
  return `import { test, expect } from '@playwright/test';
test('충실한 제출', async ({ page }) => {
  await page.goto('/sandbox/${c.sandboxSlug}');
  await page.getByTestId('${a}').click();
  await expect(page.getByTestId('${b}')).toBeVisible();
});`;
}

const badSubmission = `import { test, expect } from '@playwright/test';
test('빈약한 제출', async () => {
  const x = 1;
});`;

describe('정적 채점: 모든 sandbox 챌린지', () => {
  it('대상 챌린지가 충분히 있다', () => {
    expect(sandboxChallenges.length).toBeGreaterThan(10);
  });

  it.each(sandboxChallenges)('충실한 제출은 통과: $slug', (c) => {
    const r = gradeSubmissionStatically(c, goodSubmission(c));
    expect(r.ok).toBe(true);
    expect(r.status).toBe('passed');
  });

  it.each(sandboxChallenges)('빈약한 제출은 실패: $slug', (c) => {
    const r = gradeSubmissionStatically(c, badSubmission);
    expect(r.ok).toBe(false);
    expect(r.status).toBe('failed');
  });
});
