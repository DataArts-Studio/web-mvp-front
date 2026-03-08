import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { GenerateCasesSchema, GeneratedTestCaseSchema } from '@/entities/ai-config/model/schema';
import { getDecryptedApiKey } from '@/entities/ai-config/api/server-actions';
import { SYSTEM_PROMPT, buildUserPrompt } from '@/features/ai-generate/model/prompts';
import { z } from 'zod';

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
    throw new Error(`OpenAI API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.choices[0]?.message?.content || '';
}

async function callAnthropic(apiKey: string, model: string, systemPrompt: string, userPrompt: string) {
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
    throw new Error(`Anthropic API error ${res.status}: ${text}`);
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
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

function parseJsonResponse(raw: string): unknown[] {
  // JSON 블록 추출 (```json ... ``` 또는 순수 JSON)
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || raw.match(/(\[[\s\S]*\])/);
  const jsonStr = jsonMatch?.[1]?.trim() || raw.trim();
  return JSON.parse(jsonStr);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = GenerateCasesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 },
      );
    }

    const { projectId, description, language } = parsed.data;

    // AI 설정 조회
    const config = await getDecryptedApiKey(projectId);
    if (!config) {
      return NextResponse.json(
        { error: 'AI 설정이 되어 있지 않습니다. 설정 페이지에서 API 키를 등록해주세요.' },
        { status: 400 },
      );
    }

    const userPrompt = buildUserPrompt(description, language);

    // LLM 호출
    let rawResponse: string;
    if (config.provider === 'openai') {
      rawResponse = await callOpenAI(config.apiKey, config.model || '', SYSTEM_PROMPT, userPrompt);
    } else if (config.provider === 'gemini') {
      rawResponse = await callGemini(config.apiKey, config.model || '', SYSTEM_PROMPT, userPrompt);
    } else {
      rawResponse = await callAnthropic(config.apiKey, config.model || '', SYSTEM_PROMPT, userPrompt);
    }

    // JSON 파싱 + 검증
    let cases;
    try {
      const rawCases = parseJsonResponse(rawResponse);
      cases = z.array(GeneratedTestCaseSchema).parse(rawCases);
    } catch {
      // 파싱 실패 시 1회 재시도 없이 에러 반환
      return NextResponse.json(
        { error: 'AI 응답을 파싱할 수 없습니다. 다시 시도해주세요.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ cases });
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'generateCases' } });

    const message = error instanceof Error ? error.message : 'AI 생성에 실패했습니다.';

    // API 키 에러 구분
    if (message.includes('401') || message.includes('Unauthorized') || message.includes('invalid')) {
      return NextResponse.json(
        { error: 'API 키가 유효하지 않습니다. 설정 페이지에서 키를 확인해주세요.' },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { error: '생성에 실패했습니다. 다시 시도해주세요.' },
      { status: 500 },
    );
  }
}
