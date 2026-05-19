import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { GenerateCasesSchema, GeneratedTestCaseSchema } from '@/entities/ai-config/model/schema';
import { getDecryptedApiKey } from '@/entities/ai-config/api/server-actions';
import { AiError } from '@/entities/ai-config/model/ai-error';
import { getMonthlyUsage, recordUsage } from '@/entities/ai-usage/api/server-actions';
import { SYSTEM_PROMPT, buildUserPrompt } from '@/features/ai-generate/model/prompts';
import { z } from 'zod';

const MAX_CASES_PER_REQUEST = 10;

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
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw AiError.fromProviderResponse('gemini', res.status, text);
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

    // 월간 사용량 체크
    const usageResult = await getMonthlyUsage(projectId);
    if (usageResult.success) {
      const { used, limit } = usageResult.data;
      if (used >= limit) {
        return NextResponse.json(
          { error: `이번 달 사용 한도(${limit}건)를 초과했습니다. 다음 달에 다시 이용해주세요.` },
          { status: 429 },
        );
      }
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
    } catch (error) {
      // LLM 이 JSON 이 아닌/스키마 불일치 응답을 준 경우 — 중앙 핸들러에서 분류
      throw AiError.responseUnparsable(error);
    }

    // 1회 최대 건수 제한
    const limitedCases = cases.slice(0, MAX_CASES_PER_REQUEST);

    // 사용량 기록
    await recordUsage(projectId, 'generate_cases', limitedCases.length);

    return NextResponse.json({ cases: limitedCases });
  } catch (error) {
    if (error instanceof AiError) {
      // 사용자 환경 이슈(키 재등록/레이트/모델 설정 등)는 정상 분기라
      // Sentry 노이즈를 피해 report=true 인 예상 밖 결함만 보고한다.
      if (error.report) {
        Sentry.captureException(error, {
          extra: { action: 'generateCases', kind: error.kind, ...error.context },
        });
      }
      return NextResponse.json(
        { error: error.userMessage },
        { status: error.httpStatus },
      );
    }

    // 분류되지 않은 예상 밖 에러만 불투명 500 + 보고
    Sentry.captureException(error, { extra: { action: 'generateCases' } });
    return NextResponse.json(
      { error: '생성에 실패했습니다. 다시 시도해주세요.' },
      { status: 500 },
    );
  }
}
