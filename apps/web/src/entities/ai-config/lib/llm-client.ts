import { AiError } from '@/entities/ai-config/model/ai-error';

/**
 * 프로바이더별 LLM 호출을 한곳에 모은다. 테스트 케이스 생성·요구사항 분석·시나리오 생성 라우트가 함께 쓴다.
 * (전에는 라우트마다 사본이 있어 기본 모델 교체·응답 처리 수정이 한쪽에만 들어가곤 했다.)
 */

/** LLM 호출 전체 타임아웃. 응답이 지연·중단돼도 요청이 무한 대기하지 않도록 한다. */
const LLM_TIMEOUT_MS = 120_000;

/** 출력 토큰 기본 상한. 한국어 TC 10건은 4000 토큰을 넘기 쉬워 응답이 중간에 잘렸다. */
const DEFAULT_MAX_TOKENS = 8192;

/**
 * Gemini 는 maxOutputTokens 에 추론(thinking) 토큰이 포함된다.
 * 추론에 상한을 먼저 써 버려 본문 JSON 이 잘리지 않도록 더 넉넉히 준다.
 */
const GEMINI_MAX_OUTPUT_TOKENS = 16384;

/** 사용자가 모델을 비워 두면 쓰는 기본 모델. */
export const DEFAULT_MODELS = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-haiku-4-5-20251001',
  // gemini-2.0-flash 는 2026-06-01 종료. 공식 권장 대체 모델.
  gemini: 'gemini-3.6-flash',
} as const;

export interface LlmConfig {
  provider: string;
  apiKey: string;
  model: string;
}

export interface LlmOptions {
  maxTokens?: number;
}

export interface LlmResult {
  text: string;
  /** 출력 토큰 상한에 걸려 응답이 끝까지 오지 않았는지 */
  truncated: boolean;
}

async function callOpenAI(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number
): Promise<LlmResult> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model || DEFAULT_MODELS.openai,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      // max_tokens 는 gpt-5·o 계열에서 거부된다. max_completion_tokens 는 구형 모델도 받는다.
      // temperature 도 추론 모델은 기본값 외를 거부하므로 보내지 않는다.
      max_completion_tokens: maxTokens,
      // 모든 프롬프트가 JSON 객체를 요구하므로 JSON 모드로 고정해 앞뒤 설명문이 붙지 않게 한다.
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw AiError.fromProviderResponse('openai', res.status, text);
  }

  const data = await res.json();
  const choice = data.choices?.[0];
  return {
    text: choice?.message?.content || '',
    truncated: choice?.finish_reason === 'length',
  };
}

async function callAnthropic(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number
): Promise<LlmResult> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: model || DEFAULT_MODELS.anthropic,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw AiError.fromProviderResponse('anthropic', res.status, text);
  }

  const data = await res.json();
  const blocks: { type: string; text?: string }[] = Array.isArray(data.content) ? data.content : [];
  return {
    // 텍스트 블록이 여러 개로 나뉘어 올 수 있어 모두 잇는다.
    text: blocks
      .filter((b) => b.type === 'text')
      .map((b) => b.text ?? '')
      .join(''),
    truncated: data.stop_reason === 'max_tokens',
  };
}

async function callGemini(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number
): Promise<LlmResult> {
  const modelId = model || DEFAULT_MODELS.gemini;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`,
    {
      method: 'POST',
      signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
      // 키를 URL 쿼리에 두면 프록시·로그에 남으므로 헤더로 보낸다.
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: Math.max(maxTokens, GEMINI_MAX_OUTPUT_TOKENS),
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw AiError.fromProviderResponse('gemini', res.status, text);
  }

  const data = await res.json();
  const candidate = data.candidates?.[0];
  const parts: { text?: string; thought?: boolean }[] = candidate?.content?.parts ?? [];
  return {
    // 본문이 여러 part 로 나뉘어 올 수 있고, 추론 요약(thought)은 본문이 아니다.
    text: parts
      .filter((p) => !p.thought)
      .map((p) => p.text ?? '')
      .join(''),
    truncated: candidate?.finishReason === 'MAX_TOKENS',
  };
}

/** provider 에 맞는 LLM 을 호출해 원문 텍스트와 잘림 여부를 돌려준다. */
export async function callLlm(
  config: LlmConfig,
  systemPrompt: string,
  userPrompt: string,
  options: LlmOptions = {}
): Promise<LlmResult> {
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
  const model = config.model || '';
  if (config.provider === 'openai') {
    return callOpenAI(config.apiKey, model, systemPrompt, userPrompt, maxTokens);
  }
  if (config.provider === 'gemini') {
    return callGemini(config.apiKey, model, systemPrompt, userPrompt, maxTokens);
  }
  return callAnthropic(config.apiKey, model, systemPrompt, userPrompt, maxTokens);
}
