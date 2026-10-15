'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';

import { useTranslations } from 'next-intl';

import type { TestCaseCardType } from '@/entities/test-case';
import type { TestSuiteSection } from '@/entities/test-suite-section';
import { cn } from '@testea/util';
import { ChevronDown, Edit2, MoreHorizontal, Trash2 } from 'lucide-react';

import { TestCaseRow } from './test-case-row';

/** 섹션마다 처음 보여 주는 케이스 수. 나머지는 'N개 더 보기'로 편다. */
export const SECTION_PREVIEW = 5;

type SuiteSectionGroupProps = {
  section: TestSuiteSection;
  sectionCases: TestCaseCardType[];
  isCollapsed: boolean;
  isRenaming: boolean;
  isMenuOpen: boolean;
  editingSectionName: string;
  editSectionInputRef: React.RefObject<HTMLInputElement | null>;
  onToggle: (sectionId: string) => void;
  onMenuToggle: (sectionId: string | null) => void;
  onEditingSectionNameChange: (name: string) => void;
  onStartRename: (sectionId: string, currentName: string) => void;
  onRename: (sectionId: string) => void;
  onCancelRename: () => void;
  onDelete: (sectionId: string, caseCount: number) => void;
  onSelectTestCase: (id: string) => void;
};

/** 펼친 케이스 목록과 'N개 더 보기'. 섹션 없는 케이스 묶음도 쓴다. */
export const SectionCaseList = ({
  cases,
  onSelectTestCase,
  emptyText,
}: {
  cases: TestCaseCardType[];
  onSelectTestCase: (id: string) => void;
  emptyText?: string;
}) => {
  const t = useTranslations('suites.detail');
  const [showAll, setShowAll] = useState(false);
  if (cases.length === 0) {
    return emptyText ? <p className="py-3 pl-6 text-[12px] text-white/35">{emptyText}</p> : null;
  }
  const visible = showAll ? cases : cases.slice(0, SECTION_PREVIEW);
  const hidden = cases.length - visible.length;
  return (
    <div>
      {visible.map((testCase) => (
        <TestCaseRow key={testCase.id} testCase={testCase} onSelect={onSelectTestCase} />
      ))}
      {(hidden > 0 || showAll) && cases.length > SECTION_PREVIEW && (
        <button
          type="button"
          onClick={() => setShowAll((prev) => !prev)}
          className="py-2 pl-[86px] text-[12px] text-white/40 hover:text-white/70"
        >
          {showAll ? t('showLess') : t('showMore', { count: hidden })}
        </button>
      )}
    </div>
  );
};

export const SuiteSectionGroup = ({
  section,
  sectionCases,
  isCollapsed,
  isRenaming,
  isMenuOpen,
  editingSectionName,
  editSectionInputRef,
  onToggle,
  onMenuToggle,
  onEditingSectionNameChange,
  onStartRename,
  onRename,
  onCancelRename,
  onDelete,
  onSelectTestCase,
}: SuiteSectionGroupProps) => {
  const t = useTranslations('suites');
  // 목록 스크롤 영역에 잘리지 않도록 메뉴는 body 에 fixed 로 띄운다 (#134).
  const [menuAnchor, setMenuAnchor] = useState<{ top: number; right: number } | null>(null);

  return (
    <div className="group/section">
      {/* 섹션 헤더 */}
      <div className="mt-1 flex items-center gap-2 rounded-[4px] bg-white/[0.04] px-2.5 py-[5px] hover:bg-white/[0.06]">
        <button
          type="button"
          aria-expanded={!isCollapsed}
          aria-label={t('ui.sectionToggleAriaLabel', { name: section.name })}
          className="flex min-w-0 flex-1 items-center gap-2 py-0.5 text-left"
          onClick={() => onToggle(section.id)}
        >
          <ChevronDown
            className={cn(
              'h-3 w-3 shrink-0 text-white/60 transition-transform',
              isCollapsed && '-rotate-90'
            )}
            aria-hidden="true"
          />
          {isRenaming ? (
            <input
              ref={editSectionInputRef}
              type="text"
              aria-label={t('ui.sectionRenameAriaLabel')}
              value={editingSectionName}
              onChange={(e) => onEditingSectionNameChange(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') onRename(section.id);
                if (e.key === 'Escape') onCancelRename();
              }}
              onBlur={() => onRename(section.id)}
              onClick={(e) => e.stopPropagation()}
              className="border-primary border-b bg-transparent text-[12px] font-medium text-white outline-none"
              autoFocus
            />
          ) : (
            <span
              className="truncate text-[12px] font-medium text-white/80"
              onDoubleClick={(e) => {
                e.stopPropagation();
                onStartRename(section.id, section.name);
                setTimeout(() => editSectionInputRef.current?.focus(), 0);
              }}
            >
              {section.name}
            </span>
          )}
          <span className="shrink-0 text-[12px] text-white/35">{sectionCases.length}</span>
        </button>
        <button
          type="button"
          aria-label={t('ui.sectionActions')}
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          className="rounded-[4px] p-0.5 text-white/40 opacity-0 transition-opacity group-focus-within/section:opacity-100 group-hover/section:opacity-100 hover:bg-white/10 hover:text-white focus-visible:opacity-100 aria-expanded:opacity-100"
          onClick={(e) => {
            if (isMenuOpen) {
              onMenuToggle(null);
              return;
            }
            const rect = e.currentTarget.getBoundingClientRect();
            setMenuAnchor({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
            onMenuToggle(section.id);
          }}
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
        </button>
        {isMenuOpen &&
          menuAnchor &&
          createPortal(
            <>
              <div
                className="fixed inset-0 z-40"
                aria-hidden="true"
                onClick={() => onMenuToggle(null)}
              />
              <div
                role="menu"
                aria-label={t('ui.sectionActions')}
                style={{ top: menuAnchor.top, right: menuAnchor.right }}
                className="bg-bg-2 border-line-2 fixed z-50 min-w-[120px] rounded-[6px] border py-1 shadow-lg"
              >
                <button
                  type="button"
                  role="menuitem"
                  className="text-text-2 hover:bg-bg-3 flex w-full items-center gap-2 px-3 py-2 text-sm"
                  onClick={() => {
                    onStartRename(section.id, section.name);
                    onMenuToggle(null);
                    setTimeout(() => editSectionInputRef.current?.focus(), 0);
                  }}
                >
                  <Edit2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('ui.sectionRename')}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="hover:bg-bg-3 text-result-fail flex w-full items-center gap-2 px-3 py-2 text-sm"
                  onClick={() => {
                    onMenuToggle(null);
                    onDelete(section.id, sectionCases.length);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('ui.sectionDelete')}
                </button>
              </div>
            </>,
            document.body
          )}
      </div>

      {!isCollapsed && (
        <SectionCaseList
          cases={sectionCases}
          onSelectTestCase={onSelectTestCase}
          emptyText={t('ui.sectionEmpty')}
        />
      )}
    </div>
  );
};
