'use client';

import { type ReactNode, type TextareaHTMLAttributes, useEffect, useId, useRef } from 'react';

import { cn } from '@testea/util';
import { X } from 'lucide-react';

type Props = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'> & {
  value: string;
  onValueChange: (value: string) => void;
  /** Cmd/Ctrl+Enter 로 호출. 미지정 시 단축키 비활성. */
  onSubmit?: () => void;
  /** 최소 글자수. 미달 시 안내 문구 표시. */
  minLength?: number;
  /** 자동 높이 하한/상한 (줄 수). */
  minRows?: number;
  maxRows?: number;
  /** 입력 지우기 버튼 노출. */
  showClear?: boolean;
  /** 좌측 힌트. 미지정 시 onSubmit 있으면 단축키 안내를 자동 표시. */
  hint?: ReactNode;
  /** 인라인 에러. 지정 시 힌트 대신 에러를 빨간색으로 표시. */
  error?: string | null;
  containerClassName?: string;
};

const BASE_TEXTAREA =
  'typo-body2-normal bg-bg-1 text-text-1 placeholder:text-text-4 rounded-3 border-line-2 focus:border-primary w-full resize-none border p-4 pr-9 focus:outline-none';

/**
 * 자동 높이 + 글자수 + Cmd/Ctrl+Enter 제출 + 지우기 버튼을 갖춘 입력창.
 * 시나리오·요구사항 생성 등 프롬프트 입력의 공통 UX 컴포넌트.
 */
export const PromptTextarea = ({
  value,
  onValueChange,
  onSubmit,
  minLength,
  minRows = 4,
  maxRows = 14,
  maxLength,
  showClear = true,
  hint,
  error,
  className,
  containerClassName,
  onKeyDown,
  disabled,
  id,
  ...rest
}: Props) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const autoId = useId();
  const fieldId = id ?? autoId;

  // 내용에 맞춰 높이 자동 조절 (minRows~maxRows 범위, 초과 시 스크롤).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    const cs = getComputedStyle(el);
    const lh = parseFloat(cs.lineHeight) || 22;
    const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    const minH = lh * minRows + padY;
    const maxH = lh * maxRows + padY;
    const next = Math.max(minH, Math.min(el.scrollHeight, maxH));
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > maxH ? 'auto' : 'hidden';
  }, [value, minRows, maxRows]);

  const length = value.length;
  const belowMin = minLength != null && length > 0 && length < minLength;
  const nearMax = maxLength != null && length >= maxLength * 0.9;

  const defaultHint = onSubmit ? (
    <span>
      <kbd className="bg-bg-3 text-text-3 rounded px-1 py-0.5 text-[11px]">⌘/Ctrl + Enter</kbd> 로
      제출
    </span>
  ) : null;

  const leftMessage = error ? (
    <span className="text-error">{error}</span>
  ) : belowMin ? (
    <span className="text-text-4">최소 {minLength}자 이상 입력해주세요</span>
  ) : (
    (hint ?? defaultHint)
  );

  const showFooter = leftMessage != null || maxLength != null;

  return (
    <div className={cn('flex flex-col gap-1', containerClassName)}>
      <div className="relative">
        <textarea
          {...rest}
          id={fieldId}
          ref={ref}
          value={value}
          disabled={disabled}
          maxLength={maxLength}
          rows={minRows}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={(e) => {
            if (onSubmit && (e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault();
              if (!disabled) onSubmit();
            }
            onKeyDown?.(e);
          }}
          className={cn(BASE_TEXTAREA, className)}
        />
        {showClear && value.length > 0 && !disabled && (
          <button
            type="button"
            aria-label="입력 지우기"
            onClick={() => {
              onValueChange('');
              ref.current?.focus();
            }}
            className="text-text-4 hover:text-text-2 hover:bg-bg-3 absolute top-2.5 right-2.5 flex h-6 w-6 items-center justify-center rounded transition-colors"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
      {showFooter && (
        <div className="flex items-center justify-between gap-2">
          <span className="typo-caption">{leftMessage}</span>
          {maxLength != null && (
            <span className={cn('typo-caption shrink-0', nearMax ? 'text-error' : 'text-text-4')}>
              {length.toLocaleString()}/{maxLength.toLocaleString()}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
