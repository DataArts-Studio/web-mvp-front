'use client';

import React from 'react';

import { useTranslations } from 'next-intl';

import { cn } from '@/shared';

export type FaqItem = { question: string; answer: string; tags: string[] };

const faqId = (index: number) => `Q-${String(index + 1).padStart(2, '0')}`;

/**
 * 케이스 목록·상세처럼 생긴 FAQ. 왼쪽(모바일은 위쪽 탭) 질문을 고르면 오른쪽 상세가 바뀐다.
 * 답변은 모두 DOM 에 두고 선택되지 않은 것만 숨겨, 구조화 데이터와 화면 내용이 어긋나지 않게 한다.
 */
export const FaqPanel = ({ items }: { items: FaqItem[] }) => {
  const t = useTranslations('lending.faq');
  // 방문자가 가장 먼저 궁금해할 "정말 무료인가요?"를 열어 둔다.
  const [selected, setSelected] = React.useState(Math.min(1, items.length - 1));
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  const select = (index: number, focus = false) => {
    const next = (index + items.length) % items.length;
    setSelected(next);
    if (focus) tabRefs.current[next]?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const keys: Record<string, number> = {
      ArrowDown: 1,
      ArrowRight: 1,
      ArrowUp: -1,
      ArrowLeft: -1,
    };
    if (event.key in keys) {
      event.preventDefault();
      select(selected + keys[event.key], true);
    } else if (event.key === 'Home') {
      event.preventDefault();
      select(0, true);
    } else if (event.key === 'End') {
      event.preventDefault();
      select(items.length - 1, true);
    }
  };

  return (
    <div className="bg-bg-1/70 grid overflow-hidden rounded-lg border border-white/10 backdrop-blur-sm md:min-h-[480px] md:grid-cols-[420px_1fr]">
      <div className="border-white/10 md:border-r">
        <div className="text-text-3 hidden items-center justify-between px-6 pt-5 pb-3 text-[11px] tracking-wide md:flex">
          <span>{t('listLabel')}</span>
          <span>{items.length}</span>
        </div>
        <div
          role="tablist"
          aria-orientation="vertical"
          aria-label={t('heading')}
          onKeyDown={onKeyDown}
          className="flex gap-1.5 overflow-x-auto p-3 md:flex-col md:gap-0 md:overflow-visible md:p-0"
        >
          {items.map((item, i) => {
            const isSelected = i === selected;
            return (
              <button
                key={item.question}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                id={`faq-tab-${i}`}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-controls={`faq-panel-${i}`}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => select(i)}
                className={cn(
                  'flex shrink-0 cursor-pointer items-center gap-3 text-left text-sm transition-colors',
                  'rounded-md border px-3.5 py-2 max-md:font-medium',
                  'md:rounded-none md:border-0 md:border-l-2 md:px-6 md:py-4',
                  isSelected
                    ? 'border-primary bg-primary/10 text-text-1 md:bg-primary/[0.06]'
                    : 'text-text-3 hover:text-text-2 border-white/10 md:border-transparent md:hover:bg-white/[0.02]'
                )}
              >
                <span className={cn('text-xs', isSelected ? 'text-primary' : 'text-text-4')}>
                  <span className="md:hidden">Q{i + 1}</span>
                  <span className="hidden md:inline">{faqId(i)}</span>
                </span>
                <span className={cn('hidden truncate md:inline', isSelected && 'font-bold')}>
                  {item.question}
                </span>
                <span className="sr-only md:hidden">{item.question}</span>
              </button>
            );
          })}
        </div>
      </div>

      {items.map((item, i) => (
        <div
          key={item.question}
          id={`faq-panel-${i}`}
          role="tabpanel"
          aria-labelledby={`faq-tab-${i}`}
          hidden={i !== selected}
          className="flex flex-col p-5 max-md:border-t max-md:border-white/10 md:p-8"
        >
          <div className="flex items-center justify-between">
            <span className="text-primary text-xs font-medium">{faqId(i)}</span>
            <span className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
              {t('verified')}
            </span>
          </div>
          <h3 className="text-text-1 animate-landing-swap-in mt-4 border-b border-white/10 pb-6 text-xl leading-[1.4] font-bold break-keep md:text-[30px]">
            {item.question}
          </h3>
          <p className="text-text-3 mt-6 text-xs">{t('answerLabel')}</p>
          <p className="text-text-1 mt-2 text-sm leading-[1.7] break-keep md:text-base">
            {item.answer}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-text-3 mr-1 text-xs">{t('relatedLabel')}</span>
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="bg-bg-3 text-text-2 rounded-full border border-white/10 px-2.5 py-1 text-[11px]"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-5 md:mt-auto">
            <button
              type="button"
              onClick={() => select(i - 1)}
              className="text-text-1 hover:border-primary cursor-pointer rounded-sm border border-white/20 px-3 py-1.5 text-xs font-medium transition-colors"
            >
              ← {t('prev')}
            </button>
            <span className="text-text-3 text-xs tabular-nums">
              {i + 1} / {items.length}
            </span>
            <button
              type="button"
              onClick={() => select(i + 1)}
              className="text-text-1 hover:border-primary cursor-pointer rounded-sm border border-white/20 px-3 py-1.5 text-xs font-medium transition-colors"
            >
              {t('next')} →
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
