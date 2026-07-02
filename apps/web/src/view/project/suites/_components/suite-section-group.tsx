'use client';

import React from 'react';

import { useTranslations } from 'next-intl';

import type { TestCaseCardType } from '@/entities/test-case';
import type { TestSuiteSection } from '@/entities/test-suite-section';
import { ChevronDown, ChevronRight, Edit2, MoreHorizontal, Trash2 } from 'lucide-react';

import { TestCaseRow } from './test-case-row';

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
  return (
    <div className="border-line-2 overflow-hidden border">
      {/* 섹션 헤더 */}
      <div className="border-line-2 bg-bg-2 flex items-center justify-between border-b px-3 py-2">
        <button
          type="button"
          aria-expanded={!isCollapsed}
          aria-label={t('ui.sectionToggleAriaLabel', { name: section.name })}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          onClick={() => onToggle(section.id)}
        >
          {isCollapsed ? (
            <ChevronRight className="text-text-3 h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <ChevronDown className="text-text-3 h-4 w-4 shrink-0" aria-hidden="true" />
          )}
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
              className="typo-body2-heading text-text-1 border-primary border-b bg-transparent outline-none"
              autoFocus
            />
          ) : (
            <span
              className="text-text-1 text-sm font-medium"
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onStartRename(section.id, section.name);
                setTimeout(() => editSectionInputRef.current?.focus(), 0);
              }}
            >
              {section.name}
            </span>
          )}
          <span className="text-text-3 shrink-0 text-xs">
            {t('count.cases', { count: sectionCases.length })}
          </span>
        </button>
        <div className="relative">
          <button
            type="button"
            aria-label={t('ui.sectionActions')}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            className="text-text-3 hover:text-text-1 focus-visible:ring-primary rounded p-1 transition-colors focus-visible:ring-2 focus-visible:outline-none"
            onClick={() => onMenuToggle(isMenuOpen ? null : section.id)}
          >
            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
          </button>
          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                aria-hidden="true"
                onClick={() => onMenuToggle(null)}
              />
              <div
                role="menu"
                aria-label={t('ui.sectionActions')}
                className="bg-bg-1 border-line-2 absolute top-full right-0 z-50 mt-1 min-w-[120px] border py-1 shadow-lg"
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
                  className="hover:bg-bg-3 flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400"
                  onClick={() => {
                    onMenuToggle(null);
                    onDelete(section.id, sectionCases.length);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('ui.sectionDelete')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 섹션 케이스 목록 */}
      {!isCollapsed && (
        <div className="divide-line-2 divide-y">
          {sectionCases.length === 0 ? (
            <div className="text-text-3 px-4 py-6 text-center text-sm">{t('ui.sectionEmpty')}</div>
          ) : (
            sectionCases.map((testCase: TestCaseCardType) => (
              <TestCaseRow key={testCase.id} testCase={testCase} onSelect={onSelectTestCase} />
            ))
          )}
        </div>
      )}
    </div>
  );
};
