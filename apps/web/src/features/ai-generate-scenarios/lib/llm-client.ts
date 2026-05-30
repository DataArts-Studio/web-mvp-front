import { AiError } from '@/entities/ai-config/model/ai-error';

/**
 * 프로바이더별 LLM 호출. analyze-requirements / generate-cases 라우트의 동일 로직을
 * 시나리오 생성 라우트에서 재사용하기 위해 한곳으로 모은 것. (기존 두 라우트는 자체 사본 유지)
 */

async function callOpenAI(apiKey: string, model: string, systemPrompt: string, userPrompt: string) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
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
      temperature: 0.7,
      max_tokens: 4000,
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
  userPrompt: string
) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: model || 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
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

async function callGemini(apiKey: string, model: string, systemPrompt: string, userPrompt: string) {
  const modelId = model || 'gemini-2.0-flash';
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 4000 },
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
  config: { provider: string; apiKey: string; model: string },
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  if (config.provider === 'openai') {
    return callOpenAI(config.apiKey, config.model || '', systemPrompt, userPrompt);
  }
  if (config.provider === 'gemini') {
    return callGemini(config.apiKey, config.model || '', systemPrompt, userPrompt);
  }
  return callAnthropic(config.apiKey, config.model || '', systemPrompt, userPrompt);
}

/** LLM 응답에서 JSON 객체를 추출한다 (```json ... ``` 또는 순수 객체). */
export function parseJsonResponse(raw: string): unknown {
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || raw.match(/(\{[\s\S]*\})/);
  const jsonStr = jsonMatch?.[1]?.trim() || raw.trim();
  return JSON.parse(jsonStr);
}
