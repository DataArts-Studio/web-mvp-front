'use client';

import { useCallback, useId, useRef, useState } from 'react';

import { cn } from '@testea/util';
import { FileText, Paperclip, X } from 'lucide-react';

/**
 * AI 생성 모달용 첨부 드롭존 (FDD-TC11 V2 / 이슈 #132).
 *
 * - 지원 형식: PDF (10MB 이하) / Markdown `.md` `.markdown` (1MB 이하)
 * - 단일 파일만. 새 파일을 고르면 기존 파일을 대체한다.
 * - 클라이언트 검증은 사용자 피드백을 빠르게 주기 위한 1차 가드일 뿐이며,
 *   서버는 동일 규칙으로 한 번 더 검증한다(`extract-attachment.ts`).
 */

const ONE_MB = 1024 * 1024;

const ACCEPT_ATTR = '.pdf,.md,.markdown,application/pdf,text/markdown';

type AttachmentKind = 'pdf' | 'markdown';

interface ClientLimits {
  maxBytes: number;
  label: string;
}

const LIMITS: Record<AttachmentKind, ClientLimits> = {
  pdf: { maxBytes: 10 * ONE_MB, label: 'PDF' },
  markdown: { maxBytes: 1 * ONE_MB, label: 'Markdown' },
};

function classifyClientSide(file: File): AttachmentKind | null {
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    return 'pdf';
  }
  const name = file.name.toLowerCase();
  if (name.endsWith('.md') || name.endsWith('.markdown')) {
    return 'markdown';
  }
  if (file.type === 'text/markdown' || file.type === 'text/x-markdown') {
    return 'markdown';
  }
  return null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < ONE_MB) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / ONE_MB).toFixed(1)} MB`;
}

type Props = {
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
};

export const AiAttachmentDropzone = ({ file, onChange, disabled }: Props) => {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateAndSet = useCallback(
    (next: File | null) => {
      if (!next) {
        onChange(null);
        setError(null);
        return;
      }
      const kind = classifyClientSide(next);
      if (!kind) {
        setError('PDF 또는 Markdown 파일만 첨부할 수 있습니다.');
        return;
      }
      const limit = LIMITS[kind];
      if (next.size > limit.maxBytes) {
        setError(`${limit.label} 파일은 ${limit.maxBytes / ONE_MB}MB 이하만 첨부할 수 있습니다.`);
        return;
      }
      if (next.size === 0) {
        setError('빈 파일은 첨부할 수 없습니다.');
        return;
      }
      setError(null);
      onChange(next);
    },
    [onChange]
  );

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    const dropped = e.dataTransfer.files?.[0] ?? null;
    validateAndSet(dropped);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    validateAndSet(e.target.files?.[0] ?? null);
    // 같은 파일을 다시 고를 수 있도록 input 값 초기화
    e.target.value = '';
  };

  const handleRemove = () => {
    onChange(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  if (file) {
    const kind = classifyClientSide(file);
    return (
      <div className="border-line-2 bg-bg-3 rounded-3 flex items-center gap-3 border px-4 py-3">
        <div className="bg-primary/10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full">
          <FileText className="text-primary h-4 w-4" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="typo-body2-heading text-text-1 truncate">{file.name}</span>
          <span className="typo-caption text-text-4">
            {kind === 'pdf' ? 'PDF' : 'Markdown'} · {formatBytes(file.size)}
          </span>
        </div>
        <button
          type="button"
          onClick={handleRemove}
          disabled={disabled}
          aria-label="첨부 제거"
          className="text-text-4 hover:text-text-1 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'rounded-3 flex cursor-pointer flex-col items-center justify-center gap-1.5 border border-dashed px-4 py-5 transition-colors',
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-line-2 bg-bg-3/40 hover:border-line-3 hover:bg-bg-3',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <Paperclip className="text-text-3 h-5 w-5" />
        <span className="typo-body2-normal text-text-2">
          PDF 또는 Markdown 파일을 끌어다 놓거나 클릭해서 선택
        </span>
        <span className="typo-caption text-text-4">PDF는 10MB, Markdown은 1MB 이하</span>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPT_ATTR}
          className="hidden"
          onChange={handleFileInput}
          disabled={disabled}
        />
      </label>
      {error && (
        <p className="typo-caption text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
