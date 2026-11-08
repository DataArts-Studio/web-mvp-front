// LLM 프로바이더는 외부(unmanaged) 의존성이라 fetch 만 stub 한다 [M3]. 요청 형태와 응답 매핑이 이 모듈의 계약이다.
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AiError } from '../model/ai-error';
import { callLlm } from './llm-client';

const stubFetch = (body: unknown, status = 200) => {
  const fetchMock = vi.fn(() =>
    Promise.resolve(
      new Response(typeof body === 'string' ? body : JSON.stringify(body), { status })
    )
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

const sentBody = (fetchMock: ReturnType<typeof stubFetch>) =>
  JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
const sentUrl = (fetchMock: ReturnType<typeof stubFetch>) =>
  (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[0];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Gemini 호출', () => {
  const config = { provider: 'gemini', apiKey: 'AIza-test', model: '' };

  it('모델을 비우면 종료되지 않은 기본 모델로 요청한다.', async () => {
    const fetchMock = stubFetch({ candidates: [{ content: { parts: [{ text: '{}' }] } }] });

    await callLlm(config, 'sys', 'user');

    expect(sentUrl(fetchMock)).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent'
    );
  });

  it('JSON 응답 모드와 추론 토큰을 감안한 출력 상한으로 요청한다.', async () => {
    const fetchMock = stubFetch({ candidates: [{ content: { parts: [{ text: '{}' }] } }] });

    await callLlm(config, 'sys', 'user');

    expect(sentBody(fetchMock).generationConfig).toMatchObject({
      responseMimeType: 'application/json',
      maxOutputTokens: 16384,
    });
  });

  it('여러 part 로 나뉜 본문을 잇고 추론 요약 part 는 뺀다.', async () => {
    stubFetch({
      candidates: [
        {
          content: {
            parts: [{ text: '생각 중', thought: true }, { text: '{"cases":' }, { text: '[]}' }],
          },
          finishReason: 'STOP',
        },
      ],
    });

    const result = await callLlm(config, 'sys', 'user');

    expect(result).toEqual({ text: '{"cases":[]}', truncated: false });
  });

  it('출력 한도에 걸린 응답은 잘렸다고 표시한다.', async () => {
    stubFetch({
      candidates: [{ content: { parts: [{ text: '{"cases":[' }] }, finishReason: 'MAX_TOKENS' }],
    });

    const result = await callLlm(config, 'sys', 'user');

    expect(result.truncated).toBe(true);
  });

  it('종료된 모델의 404 응답은 모델 설정 오류로 분류한다.', async () => {
    stubFetch('{"error":{"message":"model not found"}}', 404);

    const act = callLlm({ ...config, model: 'gemini-2.0-flash' }, 'sys', 'user');

    await expect(act).rejects.toMatchObject({ kind: 'PROVIDER_BAD_MODEL' });
  });
});

describe('OpenAI 호출', () => {
  const config = { provider: 'openai', apiKey: 'sk-test', model: 'gpt-5-mini' };

  it('추론 모델도 받는 토큰 상한 필드와 JSON 모드로 요청한다.', async () => {
    const fetchMock = stubFetch({
      choices: [{ message: { content: '{}' }, finish_reason: 'stop' }],
    });

    await callLlm(config, 'sys', 'user');

    const body = sentBody(fetchMock);
    expect(body).toMatchObject({
      model: 'gpt-5-mini',
      max_completion_tokens: 8192,
      response_format: { type: 'json_object' },
    });
    expect(body).not.toHaveProperty('max_tokens');
    expect(body).not.toHaveProperty('temperature');
  });

  it('finish_reason 이 length 면 잘렸다고 표시한다.', async () => {
    stubFetch({ choices: [{ message: { content: '{"cases":[' }, finish_reason: 'length' }] });

    const result = await callLlm(config, 'sys', 'user');

    expect(result).toEqual({ text: '{"cases":[', truncated: true });
  });

  it('401 응답은 API 키 오류로 분류한다.', async () => {
    stubFetch('{"error":"invalid key"}', 401);

    const act = callLlm(config, 'sys', 'user');

    await expect(act).rejects.toBeInstanceOf(AiError);
    await expect(act).rejects.toMatchObject({ kind: 'PROVIDER_UNAUTHORIZED' });
  });
});

describe('Anthropic 호출', () => {
  const config = { provider: 'anthropic', apiKey: 'sk-ant-test', model: '' };

  it('여러 텍스트 블록을 하나로 잇는다.', async () => {
    stubFetch({
      content: [
        { type: 'thinking', thinking: '...' },
        { type: 'text', text: '{"cases":' },
        { type: 'text', text: '[]}' },
      ],
      stop_reason: 'end_turn',
    });

    const result = await callLlm(config, 'sys', 'user');

    expect(result).toEqual({ text: '{"cases":[]}', truncated: false });
  });

  it('stop_reason 이 max_tokens 면 잘렸다고 표시한다.', async () => {
    stubFetch({ content: [{ type: 'text', text: '{"cases":[' }], stop_reason: 'max_tokens' });

    const result = await callLlm(config, 'sys', 'user');

    expect(result.truncated).toBe(true);
  });

  it('호출자가 준 토큰 상한으로 요청한다.', async () => {
    const fetchMock = stubFetch({ content: [], stop_reason: 'end_turn' });

    await callLlm(config, 'sys', 'user', { maxTokens: 2000 });

    expect(sentBody(fetchMock).max_tokens).toBe(2000);
  });
});
