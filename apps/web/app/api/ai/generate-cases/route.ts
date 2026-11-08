import { NextRequest, NextResponse } from 'next/server';

import { requireProjectAccess } from '@/access/lib/require-access';
import { getDecryptedApiKey } from '@/entities/ai-config/api/decrypt-api-key';
import { callLlm } from '@/entities/ai-config/lib/llm-client';
import { AiError } from '@/entities/ai-config/model/ai-error';
import {
  GenerateCasesMultipartSchema,
  GenerateCasesSchema,
} from '@/entities/ai-config/model/schema';
import {
  type AttachmentUsageMeta,
  getMonthlyUsage,
  recordUsageAtomic,
} from '@/entities/ai-usage/api/server-actions';
import {
  type AttachmentExtractResult,
  extractAttachmentText,
} from '@/features/ai-generate/lib/extract-attachment';
import { parseGeneratedCases } from '@/features/ai-generate/lib/normalize-cases';
import {
  MAX_CASES_PER_REQUEST,
  SYSTEM_PROMPT,
  buildUserPrompt,
} from '@/features/ai-generate/model/prompts';
import * as Sentry from '@sentry/nextjs';

/**
 * multipart 본문이 PDF 10MB / MD 1MB 한도 + multipart overhead 를 넘으면 formData()
 * 파싱 비용 자체를 피해 사전 거부한다. 클라이언트가 헤더를 위조해도 후속 단계에서 한 번 더 잡힌다.
 */
const MAX_MULTIPART_BYTES = 12 * 1024 * 1024;

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
  // 거대 본문이 formData() 로 전체 메모리에 올라가기 전에 헤더 단계에서 차단한다.
  // Content-Length 가 없거나(예: chunked 전송) 숫자가 아니면 본문 크기를 사전 판정할 수
  // 없어 크기 가드가 무력화되므로, formData() 호출 전에 명시 거부한다.
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
  const parsed = GenerateCasesMultipartSchema.safeParse({
    projectId: form.get('projectId'),
    description: form.get('description') ?? '',
    language: form.get('language') ?? 'ko',
  });
  if (!parsed.success) {
    throw new InputError(parsed.error.issues[0]?.message ?? '요청 값이 올바르지 않습니다.');
  }

  // file 키가 존재하는데 File 인스턴스가 아니면 클라/서버 계약 위반이므로 조용히 무시하지 않는다.
  const fileEntry = form.get('file');
  if (fileEntry !== null && !(fileEntry instanceof File)) {
    throw new InputError('첨부 파일 형식이 올바르지 않습니다.');
  }
  const file: File | null = fileEntry;

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
    const isJson = contentType.includes('application/json');

    // 계약상 허용하는 두 가지(JSON / multipart) 외 Content-Type 은 명시 거절.
    // 그 외 값은 JSON 파서로 흘러가 의미 불명 500 으로 분류되기 쉬워서다.
    if (!isMultipart && !isJson) {
      return NextResponse.json({ error: '지원하지 않는 Content-Type 입니다.' }, { status: 415 });
    }

    const input = isMultipart ? await parseMultipartRequest(req) : await parseJsonRequest(req);

    // 임의 projectId 로 다른 프로젝트의 AI 키·월간 한도를 소진하지 못하도록, 설정 조회 전에 차단한다.
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

    // 월간 사용량 체크 (preRemaining 은 기록 트랜잭션 실패 시 fail-open 을 막는 상한)
    let preRemaining = Number.POSITIVE_INFINITY;
    const usageResult = await getMonthlyUsage(input.projectId);
    if (usageResult.success) {
      const { used, limit } = usageResult.data;
      if (used >= limit) {
        return NextResponse.json(
          { error: `이번 달 사용 한도(${limit}건)를 초과했습니다. 다음 달에 다시 이용해주세요.` },
          { status: 429 }
        );
      }
      preRemaining = limit - used;
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

    const llm = await callLlm(config, SYSTEM_PROMPT, userPrompt);

    // 항목 단위로 다듬어 쓰고, 잘린 응답은 완결된 앞부분만 건진다.
    let parsed;
    try {
      parsed = parseGeneratedCases(llm.text, llm.truncated);
    } catch (error) {
      // 한도에 걸려 아무것도 못 건졌으면 입력을 줄이라고 안내하고, 그 외 형식 오류는 보고한다.
      throw llm.truncated ? AiError.responseTruncated(error) : AiError.responseUnparsable(error);
    }
    if (parsed.dropped > 0 || parsed.salvaged) {
      Sentry.addBreadcrumb({
        category: 'ai.generate-cases',
        message: 'LLM 응답 일부를 버리거나 잘린 응답에서 건짐',
        data: { dropped: parsed.dropped, salvaged: parsed.salvaged, provider: config.provider },
      });
    }
    const cases = parsed.cases;

    // 1회 최대 건수 제한
    const limitedCases = cases.slice(0, MAX_CASES_PER_REQUEST);

    // 한도 검사·기록을 원자적으로 처리(TOCTOU 방지)하고, 남은 한도만큼만 채택해 반환한다.
    const usage = await recordUsageAtomic(
      input.projectId,
      'generate_cases',
      limitedCases.length,
      attachment ? toAttachmentMeta(attachment) : undefined
    );
    if (usage.success && usage.data.granted === 0 && limitedCases.length > 0) {
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
      : Math.min(limitedCases.length, preRemaining);
    const acceptedCases = limitedCases.slice(0, granted);

    return NextResponse.json({
      cases: acceptedCases,
      // 잘린 응답에서 건졌으면 화면에서 "일부만 생성됐다" 고 알릴 수 있게 함께 내려준다.
      partial: parsed.salvaged,
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
