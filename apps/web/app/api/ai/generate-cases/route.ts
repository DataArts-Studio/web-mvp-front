import { NextRequest, NextResponse } from 'next/server';

import { requireProjectAccess } from '@/access/lib/require-access';
import { getDecryptedApiKey } from '@/entities/ai-config/api/decrypt-api-key';
import { AiError } from '@/entities/ai-config/model/ai-error';
import {
  GenerateCasesMultipartSchema,
  GenerateCasesSchema,
  GeneratedTestCaseSchema,
} from '@/entities/ai-config/model/schema';
import {
  type AttachmentUsageMeta,
  getMonthlyUsage,
  recordUsage,
} from '@/entities/ai-usage/api/server-actions';
import {
  type AttachmentExtractResult,
  extractAttachmentText,
} from '@/features/ai-generate/lib/extract-attachment';
import { SYSTEM_PROMPT, buildUserPrompt } from '@/features/ai-generate/model/prompts';
import * as Sentry from '@sentry/nextjs';
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

function parseJsonResponse(raw: string): unknown[] {
  // JSON 블록 추출 (```json ... ``` 또는 순수 JSON)
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || raw.match(/(\[[\s\S]*\])/);
  const jsonStr = jsonMatch?.[1]?.trim() || raw.trim();
  return JSON.parse(jsonStr);
}

/**
 * JSON 경로와 multipart 경로를 단일 구조로 수렴시킨다. 첨부 본문 추출은 사용량/설정
 * 가드 통과 이후 POST 핸들러에서 수행하므로, multipart 경로도 여기서는 raw `File`
 * 만 들고 다닌다.
 */
interface NormalizedInput {
  projectId: string;
  description: string;
  language: 'ko' | 'en';
  /** multipart 경로에서 받은 첨부 파일 원본. 사용량 체크 통과 후에 본문을 추출한다. */
  attachmentFile?: File;
}

class InputError extends Error {
  constructor(public userMessage: string) {
    super(userMessage);
    this.name = 'InputError';
  }
}

async function parseJsonRequest(req: NextRequest): Promise<NormalizedInput> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new InputError('요청 본문이 올바른 JSON 형식이 아닙니다.');
  }
  const parsed = GenerateCasesSchema.safeParse(body);
  if (!parsed.success) {
    throw new InputError(parsed.error.issues[0]?.message ?? '요청 값이 올바르지 않습니다.');
  }
  return { ...parsed.data };
}

async function parseMultipartRequest(req: NextRequest): Promise<NormalizedInput> {
  const form = await req.formData();
  const parsed = GenerateCasesMultipartSchema.safeParse({
    projectId: form.get('projectId'),
    description: form.get('description') ?? '',
    language: form.get('language') ?? 'ko',
  });
  if (!parsed.success) {
    throw new InputError(parsed.error.issues[0]?.message ?? '요청 값이 올바르지 않습니다.');
  }

  const fileEntry = form.get('file');
  const file = fileEntry instanceof File ? fileEntry : null;

  // 0 바이트 파일은 첨부가 없는 것처럼 조용히 무시되지 않도록 명시 거부한다.
  if (file && file.size === 0) {
    throw new InputError('빈 파일은 첨부할 수 없습니다.');
  }

  // 파일 없으면 V1 과 동일하게 description 최소 20자 강제. 파일이 있으면 description 은 보조 컨텍스트로 풀어줌.
  if (!file && parsed.data.description.trim().length < 20) {
    throw new InputError(
      '더 구체적인 설명을 입력하거나 PDF / Markdown 파일을 첨부해주세요 (최소 20자)'
    );
  }

  return { ...parsed.data, attachmentFile: file ?? undefined };
}

function toAttachmentMeta(extract: AttachmentExtractResult): AttachmentUsageMeta {
  return {
    type: extract.type,
    sizeBytes: extract.sizeBytes,
    pageCount: extract.pageCount,
    charCount: extract.charCount,
  };
}

export async function POST(req: NextRequest) {
  try {
    const contentType = (req.headers.get('content-type') ?? '').toLowerCase();
    const isMultipart = contentType.includes('multipart/form-data');

    const input = isMultipart ? await parseMultipartRequest(req) : await parseJsonRequest(req);

    // 프로젝트 접근 토큰 검증. 외부 호출자가 임의 projectId 로 다른 프로젝트의 API 키·월간 한도를 소진하는 것을 차단한다.
    if (!(await requireProjectAccess(input.projectId))) {
      return NextResponse.json({ error: '프로젝트 접근 권한이 없습니다.' }, { status: 401 });
    }

    // AI 설정 조회
    const config = await getDecryptedApiKey(input.projectId);
    if (!config) {
      return NextResponse.json(
        { error: 'AI 설정이 되어 있지 않습니다. 설정 페이지에서 API 키를 등록해주세요.' },
        { status: 400 }
      );
    }

    // 월간 사용량 체크
    const usageResult = await getMonthlyUsage(input.projectId);
    if (usageResult.success) {
      const { used, limit } = usageResult.data;
      if (used >= limit) {
        return NextResponse.json(
          { error: `이번 달 사용 한도(${limit}건)를 초과했습니다. 다음 달에 다시 이용해주세요.` },
          { status: 429 }
        );
      }
    }

    // 한도/설정 가드 통과 후에 첨부 본문을 추출한다. 거부될 호출이 PDF 파싱 비용을 먼저 지불하지 않도록.
    let attachment: AttachmentExtractResult | undefined;
    if (input.attachmentFile) {
      attachment = await extractAttachmentText(input.attachmentFile);
    }

    const userPrompt = buildUserPrompt({
      description: input.description,
      attachment: attachment
        ? {
            type: attachment.type,
            filename:
              input.attachmentFile?.name ??
              `attachment.${attachment.type === 'pdf' ? 'pdf' : 'md'}`,
            text: attachment.text,
            truncated: attachment.truncated,
          }
        : undefined,
      language: input.language,
    });

    // LLM 호출
    let rawResponse: string;
    if (config.provider === 'openai') {
      rawResponse = await callOpenAI(config.apiKey, config.model || '', SYSTEM_PROMPT, userPrompt);
    } else if (config.provider === 'gemini') {
      rawResponse = await callGemini(config.apiKey, config.model || '', SYSTEM_PROMPT, userPrompt);
    } else {
      rawResponse = await callAnthropic(
        config.apiKey,
        config.model || '',
        SYSTEM_PROMPT,
        userPrompt
      );
    }

    // JSON 파싱 + 검증
    let cases;
    try {
      const rawCases = parseJsonResponse(rawResponse);
      cases = z.array(GeneratedTestCaseSchema).parse(rawCases);
    } catch (error) {
      // LLM 이 JSON 이 아닌/스키마 불일치 응답을 준 경우, 중앙 핸들러에서 분류한다.
      throw AiError.responseUnparsable(error);
    }

    // 1회 최대 건수 제한
    const limitedCases = cases.slice(0, MAX_CASES_PER_REQUEST);

    // 사용량 기록 (첨부 메타 포함)
    await recordUsage(
      input.projectId,
      'generate_cases',
      limitedCases.length,
      attachment ? toAttachmentMeta(attachment) : undefined
    );

    return NextResponse.json({
      cases: limitedCases,
      attachment: attachment
        ? {
            type: attachment.type,
            sizeBytes: attachment.sizeBytes,
            pageCount: attachment.pageCount,
            charCount: attachment.charCount,
            truncated: attachment.truncated,
          }
        : null,
    });
  } catch (error) {
    if (error instanceof InputError) {
      return NextResponse.json({ error: error.userMessage }, { status: 400 });
    }

    if (error instanceof AiError) {
      // 사용자 환경 이슈(키 재등록/레이트/모델 설정 / 첨부 입력 형식 등) 는 정상 분기라
      // Sentry 노이즈를 피해 report=true 인 예상 밖 결함만 보고한다.
      if (error.report) {
        Sentry.captureException(error, {
          extra: { action: 'generateCases', kind: error.kind, ...error.context },
        });
      }
      return NextResponse.json({ error: error.userMessage }, { status: error.httpStatus });
    }

    // 분류되지 않은 예상 밖 에러만 불투명 500 + 보고
    Sentry.captureException(error, { extra: { action: 'generateCases' } });
    return NextResponse.json({ error: '생성에 실패했습니다. 다시 시도해주세요.' }, { status: 500 });
  }
}
