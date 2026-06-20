import { NextRequest, NextResponse } from 'next/server';

import { requireProjectAccess } from '@/access/lib/require-access';
import { getDecryptedApiKey } from '@/entities/ai-config/api/decrypt-api-key';
import { AiError } from '@/entities/ai-config/model/ai-error';
import {
  type AttachmentUsageMeta,
  getMonthlyUsage,
  recordUsageAtomic,
} from '@/entities/ai-usage/api/server-actions';
import {
  AnalyzeRequirementsMultipartSchema,
  AnalyzeRequirementsSchema,
  RequirementAnalysisResultSchema,
} from '@/entities/requirement-analysis/model/schema';
import {
  type AttachmentExtractResult,
  extractAttachmentText,
} from '@/features/ai-generate/lib/extract-attachment';
import {
  ANALYSIS_SYSTEM_PROMPT,
  buildAnalysisPrompt,
} from '@/features/ai-requirement-analysis/model/prompts';
import * as Sentry from '@sentry/nextjs';

/**
 * multipart 본문이 PDF 10MB / MD 1MB 한도 + multipart overhead 를 넘으면 formData()
 * 파싱 비용 자체를 피해 사전 거부한다. (generate-cases 라우트와 동일 가드)
 */
const MAX_MULTIPART_BYTES = 12 * 1024 * 1024;

/** LLM 호출 전체 타임아웃. 프로바이더 응답이 지연·중단돼도 라우트가 무한 대기하지 않도록 한다. */
const LLM_TIMEOUT_MS = 120_000;

async function callOpenAI(apiKey: string, model: string, systemPrompt: string, userPrompt: string) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
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
    signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
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
      signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
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

/** LLM 응답에서 JSON 객체를 추출한다 (```json ... ``` 또는 순수 객체). */
function parseJsonResponse(raw: string): unknown {
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || raw.match(/(\{[\s\S]*\})/);
  const jsonStr = jsonMatch?.[1]?.trim() || raw.trim();
  return JSON.parse(jsonStr);
}

interface NormalizedInput {
  projectId: string;
  description: string;
  language: 'ko' | 'en';
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
  const parsed = AnalyzeRequirementsSchema.safeParse(body);
  if (!parsed.success) {
    throw new InputError(parsed.error.issues[0]?.message ?? '요청 값이 올바르지 않습니다.');
  }
  return { ...parsed.data };
}

async function parseMultipartRequest(req: NextRequest): Promise<NormalizedInput> {
  // Content-Length 가 없거나(예: chunked) 숫자가 아니면 본문 크기를 사전 판정할 수 없어
  // 크기 가드가 무력화되므로, formData() 호출 전에 명시 거부한다. (generate-cases 와 동일)
  const contentLengthRaw = req.headers.get('content-length');
  const contentLength = contentLengthRaw === null ? null : Number(contentLengthRaw);
  if (contentLength === null || !Number.isFinite(contentLength)) {
    throw new InputError('요청 본문 크기를 확인할 수 없습니다. Content-Length 헤더가 필요합니다.');
  }
  if (contentLength > MAX_MULTIPART_BYTES) {
    throw new InputError(
      `요청 본문이 너무 큽니다 (최대 ${MAX_MULTIPART_BYTES / (1024 * 1024)}MB).`
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new InputError('요청 본문이 올바른 multipart/form-data 형식이 아닙니다.');
  }
  const parsed = AnalyzeRequirementsMultipartSchema.safeParse({
    projectId: form.get('projectId'),
    description: form.get('description') ?? '',
    language: form.get('language') ?? 'ko',
  });
  if (!parsed.success) {
    throw new InputError(parsed.error.issues[0]?.message ?? '요청 값이 올바르지 않습니다.');
  }

  const fileEntry = form.get('file');
  if (fileEntry !== null && !(fileEntry instanceof File)) {
    throw new InputError('첨부 파일 형식이 올바르지 않습니다.');
  }
  const file: File | null = fileEntry;

  if (file && file.size === 0) {
    throw new InputError('빈 파일은 첨부할 수 없습니다.');
  }

  // 파일 없으면 요구사항 최소 20자 강제. 파일이 있으면 요구사항은 보조 컨텍스트로 풀어줌.
  if (!file && parsed.data.description.trim().length < 20) {
    throw new InputError(
      '더 구체적인 요구사항을 입력하거나 PDF / Markdown 파일을 첨부해주세요 (최소 20자)'
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
    const isJson = contentType.includes('application/json');

    if (!isMultipart && !isJson) {
      return NextResponse.json({ error: '지원하지 않는 Content-Type 입니다.' }, { status: 415 });
    }

    const input = isMultipart ? await parseMultipartRequest(req) : await parseJsonRequest(req);

    if (!(await requireProjectAccess(input.projectId))) {
      return NextResponse.json({ error: '프로젝트 접근 권한이 없습니다.' }, { status: 401 });
    }

    const config = await getDecryptedApiKey(input.projectId);
    if (!config) {
      return NextResponse.json(
        { error: 'AI 설정이 되어 있지 않습니다. 설정 페이지에서 API 키를 등록해주세요.' },
        { status: 400 }
      );
    }

    // 낙관적 사전 검사: 이미 한도를 다 쓴 경우 LLM 호출 전에 빠르게 거절한다.
    // 실제 한도 선점은 LLM 응답 후 recordUsageAtomic 이 원자적으로 처리한다.
    // preRemaining 은 기록 트랜잭션이 실패했을 때 fail-open 을 막는 상한으로 쓴다.
    let preRemaining = Number.POSITIVE_INFINITY;
    const usageResult = await getMonthlyUsage(input.projectId);
    if (usageResult.success) {
      if (usageResult.data.used >= usageResult.data.limit) {
        return NextResponse.json(
          {
            error: `이번 달 사용 한도(${usageResult.data.limit}건)를 초과했습니다. 다음 달에 다시 이용해주세요.`,
          },
          { status: 429 }
        );
      }
      preRemaining = usageResult.data.limit - usageResult.data.used;
    }

    let attachment: AttachmentExtractResult | undefined;
    if (input.attachmentFile) {
      attachment = await extractAttachmentText(input.attachmentFile);
    }

    const userPrompt = buildAnalysisPrompt({
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

    let rawResponse: string;
    if (config.provider === 'openai') {
      rawResponse = await callOpenAI(
        config.apiKey,
        config.model || '',
        ANALYSIS_SYSTEM_PROMPT,
        userPrompt
      );
    } else if (config.provider === 'gemini') {
      rawResponse = await callGemini(
        config.apiKey,
        config.model || '',
        ANALYSIS_SYSTEM_PROMPT,
        userPrompt
      );
    } else {
      rawResponse = await callAnthropic(
        config.apiKey,
        config.model || '',
        ANALYSIS_SYSTEM_PROMPT,
        userPrompt
      );
    }

    let result;
    try {
      const parsed = parseJsonResponse(rawResponse);
      result = RequirementAnalysisResultSchema.parse(parsed);
    } catch (error) {
      throw AiError.responseUnparsable(error);
    }

    // 한도 검사·기록을 원자적으로 처리(TOCTOU 방지)하고, 채택된 만큼만 잘라 반환한다.
    const usage = await recordUsageAtomic(
      input.projectId,
      'analyze_requirements',
      result.scenarios.length,
      attachment ? toAttachmentMeta(attachment) : undefined
    );
    if (usage.success && usage.data.granted === 0 && result.scenarios.length > 0) {
      return NextResponse.json(
        {
          error: `이번 달 사용 한도(${usage.data.limit}건)를 초과했습니다. 다음 달에 다시 이용해주세요.`,
        },
        { status: 429 }
      );
    }
    // 기록 트랜잭션이 실패하면 사용량 미집계 상태이므로, 사전 잔여량을 넘겨 반환하지 않는다(fail-open 방지).
    const granted = usage.success
      ? usage.data.granted
      : Math.min(result.scenarios.length, preRemaining);
    const limitedScenarios = result.scenarios.slice(0, granted);

    return NextResponse.json({
      analysis: result.analysis,
      scenarios: limitedScenarios,
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
      if (error.report) {
        Sentry.captureException(error, {
          extra: { action: 'analyzeRequirements', kind: error.kind, ...error.context },
        });
      }
      return NextResponse.json({ error: error.userMessage }, { status: error.httpStatus });
    }

    Sentry.captureException(error, { extra: { action: 'analyzeRequirements' } });
    return NextResponse.json({ error: '분석에 실패했습니다. 다시 시도해주세요.' }, { status: 500 });
  }
}
