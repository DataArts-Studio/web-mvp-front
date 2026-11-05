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
      // 상한 뒤쪽은 다른 문자로 채워, 잘린 부분이 프롬프트에 섞이지 않는지 확인한다.
      steps: 's'.repeat(MAX_STEPS_CHARS) + 'x'.repeat(1_000),
      snapshot: 'n'.repeat(MAX_SNAPSHOT_CHARS * 5),
      caseTitle: '케이스',
    });

    const prompt = sentUserPrompt();
    expect(prompt.match(/s+/g)?.some((run) => run.length > MAX_STEPS_CHARS)).toBe(false);
    expect(prompt).toContain('s'.repeat(MAX_STEPS_CHARS));
    expect(prompt).not.toContain('x');
    expect(prompt).toContain('n'.repeat(MAX_SNAPSHOT_CHARS));
    expect(prompt).not.toContain('n'.repeat(MAX_SNAPSHOT_CHARS + 1));
    expect(prompt).toContain('(이하 생략)');
  });

  it('케이스 제목이 200자를 넘으면 200자까지만 보낸다', async () => {
    await generateSpec({
      steps: '로그인 확인',
      snapshot: '- button "로그인"',
      caseTitle: 'T'.repeat(201),
    });

    const prompt = sentUserPrompt();
    expect(prompt).toContain(`케이스 제목: ${'T'.repeat(200)}\n…(이하 생략)`);
    expect(prompt).not.toContain('T'.repeat(201));
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
