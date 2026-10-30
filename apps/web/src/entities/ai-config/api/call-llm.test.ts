// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

import { callLlm } from './call-llm';

vi.mock('server-only', () => ({}));

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

function lastBody() {
  return JSON.parse(fetchMock.mock.calls.at(-1)![1].body as string);
}

afterEach(() => fetchMock.mockReset());

describe('callLlm 생성 옵션', () => {
  it('옵션이 없으면 기존 기본값으로 호출한다.', async () => {
    fetchMock.mockResolvedValue(
      Response.json({ choices: [{ message: { content: 'ok' } }] }, { status: 200 })
    );
    await callLlm({ provider: 'openai', apiKey: 'sk-test-dummy', model: null }, 's', 'u');
    expect(lastBody()).toMatchObject({ temperature: 0.7, max_tokens: 4000 });
  });

  it('옵션을 주면 그 값으로 호출한다.', async () => {
    fetchMock.mockResolvedValue(
      Response.json({ candidates: [{ content: { parts: [{ text: 'ok' }] } }] }, { status: 200 })
    );
    await callLlm({ provider: 'gemini', apiKey: 'gemini-test-dummy', model: null }, 's', 'u', {
      temperature: 0.1,
      maxTokens: 2048,
    });
    expect(lastBody().generationConfig).toEqual({ temperature: 0.1, maxOutputTokens: 2048 });
  });

  it('Anthropic 은 temperature 를 명시했을 때만 보낸다.', async () => {
    const reply = () => Response.json({ content: [{ type: 'text', text: 'ok' }] }, { status: 200 });
    fetchMock.mockImplementation(async () => reply());
    const config = { provider: 'anthropic', apiKey: 'sk-ant-test-dummy', model: null };

    await callLlm(config, 's', 'u');
    expect(lastBody()).not.toHaveProperty('temperature');

    await callLlm(config, 's', 'u', { temperature: 0.1 });
    expect(lastBody().temperature).toBe(0.1);
  });
});
