import 'server-only';

import { AiError } from '../model/ai-error';

/**
 * 프로젝트 AI 설정(provider/apiKey/model)으로 LLM 을 호출한다.
 * generate-cases, analyze-requirements, generate-scenarios 라우트가 같이 쓴다.
 */

/** 호출별로 바꿀 수 있는 생성 옵션. 기본값은 케이스·분석 생성 라우트 기준이다. */
export interface LlmCallOptions {
  temperature?: number;
  maxTokens?: number;
  /** 응답 대기 상한. 응답이 지연·중단돼도 요청이 무한 대기하지 않도록 한다. */
  timeoutMs?: number;
}

const DEFAULT_OPTIONS: Required<LlmCallOptions> = {
  temperature: 0.7,
  maxTokens: 4000,
  timeoutMs: 120_000,
};

async function callOpenAI(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  options: Required<LlmCallOptions>
) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    signal: AbortSignal.timeout(options.timeoutMs),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: options.temperature,
      max_tokens: options.maxTokens,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw AiError.fromProviderResponse('openai', res.status, text);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callAnthropic(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  options: Required<Omit<LlmCallOptions, 'temperature'>> & { temperature?: number }
) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    signal: AbortSignal.timeout(options.timeoutMs),
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: model || 'claude-haiku-4-5-20251001',
      max_tokens: options.maxTokens,
      // 기존 호출은 temperature 를 보내지 않았다(제공자 기본값). 명시한 호출만 보낸다.
      ...(options.temperature === undefined ? {} : { temperature: options.temperature }),
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw AiError.fromProviderResponse('anthropic', res.status, text);
  }

  const data = await res.json();
  const textBlock = data.content?.find((b: { type: string }) => b.type === 'text');
  return textBlock?.text || '';
}

async function callGemini(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  options: Required<LlmCallOptions>
) {
  const modelId = model || 'gemini-2.0-flash';
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      signal: AbortSignal.timeout(options.timeoutMs),
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: options.temperature,
          maxOutputTokens: options.maxTokens,
        },
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw AiError.fromProviderResponse('gemini', res.status, text);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/** provider 에 맞는 LLM 을 호출해 원문 텍스트를 돌려준다. */
export async function callLlm(
  config: { provider: string; apiKey: string; model: string | null },
  systemPrompt: string,
  userPrompt: string,
  options: LlmCallOptions = {}
): Promise<string> {
  const resolved = { ...DEFAULT_OPTIONS, ...options };
  if (config.provider === 'openai') {
    return callOpenAI(config.apiKey, config.model || '', systemPrompt, userPrompt, resolved);
  }
  if (config.provider === 'gemini') {
    return callGemini(config.apiKey, config.model || '', systemPrompt, userPrompt, resolved);
  }
  return callAnthropic(config.apiKey, config.model || '', systemPrompt, userPrompt, {
    ...resolved,
    temperature: options.temperature,
  });
}

/** LLM 응답에서 JSON 객체를 추출한다 (```json ... ``` 또는 순수 객체). */
export function parseJsonResponse(raw: string): unknown {
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || raw.match(/(\{[\s\S]*\})/);
  const jsonStr = jsonMatch?.[1]?.trim() || raw.trim();
  return JSON.parse(jsonStr);
}
