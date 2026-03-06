'use client';

import React from 'react';

import type { TestSuiteSection } from '@/entities/test-suite-section';
import type { TestCaseCardType } from '@/entities/test-case';
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
  return (
    <div className="bg-bg-2 border-line-2 rounded-4 overflow-hidden border">
      {/* 섹션 헤더 */}
      <div className="border-line-2 flex items-center justify-between border-b px-4 py-2.5">
        <button
          type="button"
          className="flex flex-1 items-center gap-2 text-left"
          onClick={() => onToggle(section.id)}
        >
          {isCollapsed
            ? <ChevronRight className="text-text-3 h-4 w-4 shrink-0" />
            : <ChevronDown className="text-text-3 h-4 w-4 shrink-0" />
          }
          {isRenaming ? (
            <input
              ref={editSectionInputRef}
              type="text"
              value={editingSectionName}
              onChange={(e) => onEditingSectionNameChange(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') onRename(section.id);
                if (e.key === 'Escape') onCancelRename();
              }}
              onBlur={() => onRename(section.id)}
              onClick={(e) => e.stopPropagation()}
              className="typo-body2-heading text-text-1 bg-transparent outline-none border-b border-primary"
              autoFocus
            />
          ) : (
            <span
              className="typo-body2-heading text-text-1"
              onDoubleClick={(e) => {
                e.stopPropagation();
                onStartRename(section.id, section.name);
                setTimeout(() => editSectionInputRef.current?.focus(), 0);
              }}
            >
              {section.name}
            </span>
          )}
          <span className="text-text-3 text-xs">{sectionCases.length}개</span>
        </button>
        <div className="relative">
          <button
            type="button"
            className="text-text-3 hover:text-text-1 rounded p-1 transition-colors"
            onClick={() => onMenuToggle(isMenuOpen ? null : section.id)}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => onMenuToggle(null)} />
              <div className="bg-bg-2 border-line-2 absolute right-0 top-full z-50 mt-1 rounded-2 border py-1 shadow-lg min-w-[120px]">
                <button
                  type="button"
                  className="text-text-2 hover:bg-bg-3 flex w-full items-center gap-2 px-3 py-2 text-sm"
                  onClick={() => {
                    onStartRename(section.id, section.name);
                    onMenuToggle(null);
                    setTimeout(() => editSectionInputRef.current?.focus(), 0);
                  }}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  이름 수정
                </button>
                <button
                  type="button"
                  className="text-red-400 hover:bg-bg-3 flex w-full items-center gap-2 px-3 py-2 text-sm"
                  onClick={() => {
                    onMenuToggle(null);
                    onDelete(section.id, sectionCases.length);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  섹션 삭제
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
            <div className="text-text-3 px-4 py-6 text-center text-sm">
              이 섹션에 배정된 케이스가 없습니다.
            </div>
          ) : (
            sectionCases.map((testCase: TestCaseCardType) => (
              <TestCaseRow
                key={testCase.id}
                testCase={testCase}
                onSelect={onSelectTestCase}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};
