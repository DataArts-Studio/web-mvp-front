'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';

import { useTranslations } from 'next-intl';

import type { TestCaseCardType, TestCaseResultStatus } from '@/entities/test-case';
import { cn, formatRelativeTime } from '@testea/util';
import { Copy, MoreHorizontal } from 'lucide-react';

import { recentSlotsOf } from './case-list-model';

/** 행에 바로 보이는 태그 수. 나머지는 +n 으로 줄인다. */
const VISIBLE_TAGS = 2;

const RESULT_TONE: Record<TestCaseResultStatus, string> = {
  pass: 'bg-result-pass',
  fail: 'bg-result-fail',
  blocked: 'bg-result-blocked',
  untested: 'bg-white/[0.12]',
};

interface CaseListRowProps {
  testCase: TestCaseCardType;
  onDuplicate: (testCaseId: string) => void;
}

/** 행 본문. 클릭·키보드 선택은 감싸는 쪽(CaseListSection)이 맡는다. */
export const CaseListRow = ({ testCase, onDuplicate }: CaseListRowProps) => {
  const t = useTranslations('cases');
  // 행·스크롤 영역에 잘리지 않도록 메뉴는 body 에 fixed 로 띄운다 (#134).
  const [menuAnchor, setMenuAnchor] = useState<{ top: number; right: number } | null>(null);
  const isMenuOpen = menuAnchor !== null;
  const slots = recentSlotsOf(testCase.recentResults);
  const recent = testCase.recentResults ?? [];
  const tags = testCase.tags ?? [];

  const recentLabel =
    recent.length === 0
      ? t('ui.recentResultsNone')
      : t('ui.recentResults', {
          count: recent.length,
          summary: recent.map((status) => t(`ui.resultLabels.${status}`)).join(', '),
        });

  return (
    <div className="flex w-full min-w-0 items-center gap-3">
      <span className="w-[52px] shrink-0 font-mono text-[11px] text-white/40">
        {testCase.caseKey}
      </span>
      <span className="group-hover:text-text-1 min-w-0 flex-1 truncate text-[13px] text-white/90">
        {testCase.title}
      </span>

      {tags.length > 0 && (
        <span className="hidden shrink-0 items-center gap-1 md:flex">
          {tags.slice(0, VISIBLE_TAGS).map((tag) => (
            <span
              key={tag}
              className="max-w-[96px] truncate rounded-[3px] bg-white/[0.08] px-1.5 py-px text-[10.5px] text-white/70"
            >
              {tag}
            </span>
          ))}
          {tags.length > VISIBLE_TAGS && (
            <span className="text-[10.5px] text-white/40">
              {t('ui.moreTags', { count: tags.length - VISIBLE_TAGS })}
            </span>
          )}
        </span>
      )}

      <span
        role="img"
        aria-label={recentLabel}
        title={recentLabel}
        className="flex shrink-0 gap-[2px]"
      >
        {slots.map((status, i) => (
          <span
            key={i}
            className={cn(
              'h-3 w-[5px] rounded-[1px]',
              status ? RESULT_TONE[status] : 'bg-white/[0.07]'
            )}
          />
        ))}
      </span>

      <span className="hidden w-[72px] shrink-0 text-right text-[11px] whitespace-nowrap text-white/35 sm:block">
        {formatRelativeTime(testCase.updatedAt)}
      </span>

      <div className="relative flex shrink-0 items-center">
        <button
          type="button"
          aria-label={t('ui.caseActions')}
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          className="focus-visible:ring-primary cursor-pointer rounded-[4px] p-0.5 text-white/40 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-white/10 hover:text-white focus-visible:opacity-100 focus-visible:ring-2 focus-visible:outline-none"
          onClick={(e) => {
            e.stopPropagation();
            if (isMenuOpen) return setMenuAnchor(null);
            const rect = e.currentTarget.getBoundingClientRect();
            setMenuAnchor({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
          }}
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
        </button>
        {menuAnchor &&
          createPortal(
            <>
              <div
                className="fixed inset-0 z-40"
                aria-hidden="true"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuAnchor(null);
                }}
              />
              <div
                role="menu"
                aria-label={t('ui.caseActions')}
                style={{ top: menuAnchor.top, right: menuAnchor.right }}
                className="bg-bg-2 border-line-2 rounded-2 fixed z-50 min-w-[120px] border py-1 shadow-lg"
              >
                <button
                  type="button"
                  role="menuitem"
                  className="text-text-2 hover:bg-bg-3 flex w-full items-center gap-2 px-3 py-2 text-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuAnchor(null);
                    onDuplicate(testCase.id);
                  }}
                >
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('ui.duplicate')}
                </button>
              </div>
            </>,
            document.body
          )}
      </div>
    </div>
  );
};
