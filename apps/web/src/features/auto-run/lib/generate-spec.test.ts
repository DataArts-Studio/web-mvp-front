// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MAX_SNAPSHOT_CHARS, MAX_STEPS_CHARS, generateSpec } from './generate-spec';

vi.mock('server-only', () => ({}));

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubEnv('OPENAI_API_KEY', 'synthetic-openai-key');
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockResolvedValue(
    new Response(
      JSON.stringify({
        choices: [{ message: { content: "import { test, expect } from '@playwright/test';" } }],
      })
    )
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

function sentUserPrompt(): string {
  const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
  return body.messages[1].content as string;
}

describe('generateSpec 프롬프트 입력 길이', () => {
  it('스냅샷과 단계가 상한을 넘으면 잘라서 보낸다', async () => {
    await generateSpec({
      steps: 's'.repeat(MAX_STEPS_CHARS + 1_000),
      snapshot: 'n'.repeat(MAX_SNAPSHOT_CHARS * 5),
      caseTitle: '케이스',
    });

    const prompt = sentUserPrompt();
    expect(prompt.match(/s+/g)?.some((run) => run.length > MAX_STEPS_CHARS)).toBe(false);
    expect(prompt).toContain('s'.repeat(MAX_STEPS_CHARS));
    expect(prompt).toContain('n'.repeat(MAX_SNAPSHOT_CHARS));
    expect(prompt).not.toContain('n'.repeat(MAX_SNAPSHOT_CHARS + 1));
    expect(prompt).toContain('(이하 생략)');
  });

  it('상한 이하 입력은 그대로 보낸다', async () => {
    await generateSpec({
      steps: '로그인 확인',
      snapshot: '- button "로그인"',
      caseTitle: '케이스',
    });
    const prompt = sentUserPrompt();
    expect(prompt).toContain('로그인 확인');
    expect(prompt).toContain('- button "로그인"');
    expect(prompt).not.toContain('(이하 생략)');
  });
});
