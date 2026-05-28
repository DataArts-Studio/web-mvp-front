/**
 * AI 생성 첨부 파일 처리 유틸 (FDD-TC11 V2 / 이슈 #132).
 *
 * - 지원 형식: PDF (라이브러리 파싱) / Markdown (UTF-8 디코딩, 별도 파싱 없음)
 * - 본 모듈은 서버 라우트 핸들러에서만 호출. 추출된 텍스트는 응답 후 폐기되며
 *   DB 에는 메타(타입·크기·페이지 수·문자 수) 만 기록한다 (`ai_usage_logs`).
 * - 실패 케이스는 모두 `AiError` 로 분류되어 사용자 안내·HTTP 상태가 정해진다.
 */
import { AiError } from '@/entities/ai-config/model/ai-error';
import { extractText, getDocumentProxy } from 'unpdf';

const ONE_MB = 1024 * 1024;

export const ATTACHMENT_LIMITS = {
  pdf: {
    maxBytes: 10 * ONE_MB,
    mimeTypes: ['application/pdf'] as readonly string[],
    extensions: ['.pdf'] as readonly string[],
  },
  markdown: {
    // text/plain 은 .txt 등 무관 파일까지 포함하는 너무 넓은 카테고리라 제외하고,
    // 클라이언트 (ai-attachment-dropzone) 와 동일한 규칙으로 좁힌다.
    // .md 확장자에 text/plain MIME 이 붙는 흔한 케이스는 확장자 매칭으로 통과한다.
    maxBytes: 1 * ONE_MB,
    mimeTypes: ['text/markdown', 'text/x-markdown'] as readonly string[],
    extensions: ['.md', '.markdown'] as readonly string[],
  },
} as const;

/**
 * LLM 컨텍스트 보호용 추출 텍스트 길이 상한.
 * 초과분은 잘라내고 호출 측이 사용자에게 "잘렸음" 안내를 결정한다.
 */
export const MAX_EXTRACTED_CHARS = 50_000;

export type AttachmentType = 'pdf' | 'markdown';

export interface AttachmentExtractResult {
  type: AttachmentType;
  /** 사용자 프롬프트에 합성할 본문. 최대 MAX_EXTRACTED_CHARS 자로 잘릴 수 있다. */
  text: string;
  sizeBytes: number;
  /** PDF 일 때만 채워짐. Markdown 은 null. */
  pageCount: number | null;
  /** 추출된 텍스트 문자 수 (post-truncation). */
  charCount: number;
  /** MAX_EXTRACTED_CHARS 초과로 잘렸는지 여부. */
  truncated: boolean;
}

/**
 * MIME 타입과 파일명으로 첨부 파일 종류를 판별한다.
 * 일부 브라우저/OS 가 PDF 를 `application/octet-stream` 으로, Markdown 을 `text/plain`
 * 또는 빈 문자열로 내려주는 경우가 있어 MIME 과 확장자 중 하나만 일치해도 허용한다.
 */
export function classifyAttachment(file: File): AttachmentType {
  const name = file.name.toLowerCase();

  const hasPdfMime = ATTACHMENT_LIMITS.pdf.mimeTypes.includes(file.type);
  const hasPdfExt = ATTACHMENT_LIMITS.pdf.extensions.some((ext) => name.endsWith(ext));
  if (hasPdfMime || hasPdfExt) {
    return 'pdf';
  }

  const hasMarkdownMime = ATTACHMENT_LIMITS.markdown.mimeTypes.includes(file.type);
  const hasMarkdownExt = ATTACHMENT_LIMITS.markdown.extensions.some((ext) => name.endsWith(ext));
  if (hasMarkdownMime || hasMarkdownExt) {
    return 'markdown';
  }

  throw AiError.attachmentUnsupportedType(file.type, file.name);
}

/**
 * 첨부 파일에서 텍스트를 추출한다.
 *
 * 동작:
 * - PDF: `unpdf` 로 모든 페이지 텍스트 추출 후 합침
 * - Markdown: UTF-8 디코딩만 수행. 별도 파싱 없이 원본 그대로 반환 (헤딩·리스트·코드블록 구조 정보가 그대로 LLM 에 합성됨)
 *
 * 추출 결과가 0자면 `ATTACHMENT_EMPTY`, MAX_EXTRACTED_CHARS 초과면 잘라낸 뒤 truncated=true.
 */
export async function extractAttachmentText(file: File): Promise<AttachmentExtractResult> {
  const type = classifyAttachment(file);
  const sizeBytes = file.size;

  const limit = ATTACHMENT_LIMITS[type];
  if (sizeBytes > limit.maxBytes) {
    throw AiError.attachmentTooLarge(type, sizeBytes, limit.maxBytes);
  }

  if (sizeBytes === 0) {
    throw AiError.attachmentEmpty(type);
  }

  const buffer = await file.arrayBuffer();

  if (type === 'markdown') {
    const raw = decodeUtf8(buffer);
    const text = truncate(raw, MAX_EXTRACTED_CHARS);
    // 공백·개행만 든 .md 도 LLM 호출 비용만 발생시키고 무의미한 케이스를 생성하므로
    // PDF 분기처럼 정규화 후 의미 있는 문자가 없으면 빈 첨부로 거절한다.
    if (text.trim().length === 0) {
      throw AiError.attachmentEmpty('markdown');
    }
    return {
      type: 'markdown',
      text,
      sizeBytes,
      pageCount: null,
      charCount: text.length,
      truncated: raw.length > MAX_EXTRACTED_CHARS,
    };
  }

  // PDF
  let pdf: Awaited<ReturnType<typeof getDocumentProxy>>;
  let extracted: { text: string; totalPages: number };
  try {
    pdf = await getDocumentProxy(new Uint8Array(buffer));
    extracted = await extractText(pdf, { mergePages: true });
  } catch (cause) {
    throw AiError.attachmentParseFailed(cause);
  }

  const rawText = Array.isArray(extracted.text) ? extracted.text.join('\n') : extracted.text;
  const normalized = rawText.replace(/\s+\n/g, '\n').trim();
  const text = truncate(normalized, MAX_EXTRACTED_CHARS);

  if (text.length === 0) {
    throw AiError.attachmentEmpty('pdf');
  }

  return {
    type: 'pdf',
    text,
    sizeBytes,
    pageCount: extracted.totalPages,
    charCount: text.length,
    truncated: normalized.length > MAX_EXTRACTED_CHARS,
  };
}

/**
 * Markdown UTF-8 디코딩. BOM 제거. 디코딩 실패는 Markdown 전용 에러로 분류한다
 * (PDF 추출 실패 메시지를 그대로 노출하지 않게).
 */
function decodeUtf8(buffer: ArrayBuffer): string {
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: false });
    const text = decoder.decode(buffer);
    // BOM 이 남아 있으면 제거
    return text.replace(/^﻿/, '');
  } catch (cause) {
    throw AiError.attachmentDecodeFailed(cause);
  }
}

function truncate(text: string, maxChars: number): string {
  return text.length > maxChars ? text.slice(0, maxChars) : text;
}
