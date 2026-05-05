'use client';

import React from 'react';

import type { TestSuiteSection } from '@/entities/test-suite-section';
import type { TestCaseCardType } from '@/entities/test-case';
import { DSButton, EmptyState } from '@testea/ui';
import { ChevronDown, ChevronRight, ListChecks, Plus } from 'lucide-react';
import { SuiteSectionGroup } from './suite-section-group';
import { TestCaseRow } from './test-case-row';

type SuiteCaseListSectionProps = {
  sections: TestSuiteSection[];
  testCases: TestCaseCardType[];
  casesBySection: Map<string | null, TestCaseCardType[]>;
  uncategorizedCases: TestCaseCardType[];
  collapsedSections: Set<string>;
  editingSectionId: string | null;
  editingSectionName: string;
  menuOpenSectionId: string | null;
  isCreatingSection: boolean;
  newSectionName: string;
  createSectionIsPending: boolean;
  createSectionError: string | null;
  newSectionInputRef: React.RefObject<HTMLInputElement | null>;
  editSectionInputRef: React.RefObject<HTMLInputElement | null>;
  onToggleSection: (sectionId: string) => void;
  onSetMenuOpenSectionId: (id: string | null) => void;
  onSetEditingSectionName: (name: string) => void;
  onStartRename: (id: string, name: string) => void;
  onRenameSection: (sectionId: string) => void;
  onCancelRename: () => void;
  onDeleteSection: (sectionId: string, caseCount: number) => void;
  onSelectTestCase: (id: string) => void;
  onStartCreatingSection: () => void;
  onSetNewSectionName: (name: string) => void;
  onCreateSection: () => void;
  onCancelCreateSection: () => void;
  onAddCases: () => void;
};

export const SuiteCaseListSection = ({
  sections,
  testCases,
  casesBySection,
  uncategorizedCases,
  collapsedSections,
  editingSectionId,
  editingSectionName,
  menuOpenSectionId,
  isCreatingSection,
  newSectionName,
  createSectionIsPending,
  createSectionError,
  newSectionInputRef,
  editSectionInputRef,
  onToggleSection,
  onSetMenuOpenSectionId,
  onSetEditingSectionName,
  onStartRename,
  onRenameSection,
  onCancelRename,
  onDeleteSection,
  onSelectTestCase,
  onStartCreatingSection,
  onSetNewSectionName,
  onCreateSection,
  onCancelCreateSection,
  onAddCases,
}: SuiteCaseListSectionProps) => {
  return (
    <section className="col-span-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="typo-h2-heading">포함된 테스트 케이스</h2>
        <div className="flex items-center gap-2">
          <DSButton
            variant="ghost"
            size="small"
            className="flex items-center gap-1"
            onClick={onStartCreatingSection}
          >
            <Plus className="h-4 w-4" />
            섹션 추가
          </DSButton>
          {testCases.length > 0 && (
            <DSButton variant="ghost" size="small" className="flex items-center gap-1" onClick={onAddCases}>
              <Plus className="h-4 w-4" />
              케이스 추가
            </DSButton>
          )}
        </div>
      </div>

      {testCases.length === 0 && sections.length === 0 ? (
        <div className="bg-bg-2 border-line-2 rounded-4 border-2 border-dashed">
          <EmptyState
            icon={<ListChecks className="h-8 w-8" />}
            title="포함된 테스트 케이스가 없습니다."
            description="테스트 케이스를 추가하여 스위트 범위를 정의하세요."
            action={
              <DSButton variant="ghost" className="flex items-center gap-1" onClick={onAddCases}>
                <Plus className="h-4 w-4" />
                테스트 케이스 추가
              </DSButton>
            }
          />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* 섹션별 그룹 */}
          {sections.map((section) => (
            <SuiteSectionGroup
              key={section.id}
              section={section}
              sectionCases={casesBySection.get(section.id) ?? []}
              isCollapsed={collapsedSections.has(section.id)}
              isRenaming={editingSectionId === section.id}
              isMenuOpen={menuOpenSectionId === section.id}
              editingSectionName={editingSectionName}
              editSectionInputRef={editSectionInputRef}
              onToggle={onToggleSection}
              onMenuToggle={onSetMenuOpenSectionId}
              onEditingSectionNameChange={onSetEditingSectionName}
              onStartRename={onStartRename}
              onRename={onRenameSection}
              onCancelRename={onCancelRename}
              onDelete={onDeleteSection}
              onSelectTestCase={onSelectTestCase}
            />
          ))}

          {/* 섹션 추가 인라인 입력 */}
          {isCreatingSection && (
            <div className="flex flex-col gap-1">
              <div className="bg-bg-2 border-line-2 rounded-4 flex items-center gap-2 border px-4 py-3">
                <Plus className="text-text-3 h-4 w-4 shrink-0" />
                <input
                  ref={newSectionInputRef}
                  type="text"
                  value={newSectionName}
                  onChange={(e) => onSetNewSectionName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onCreateSection();
                    if (e.key === 'Escape') onCancelCreateSection();
                  }}
                  placeholder="새 섹션 이름을 입력하세요"
                  className="typo-body2-normal text-text-1 placeholder:text-text-3 flex-1 bg-transparent outline-none"
                  disabled={createSectionIsPending}
                />
                <DSButton
                  size="small"
                  variant="solid"
                  onClick={onCreateSection}
                  disabled={createSectionIsPending || !newSectionName.trim()}
                >
                  {createSectionIsPending ? '생성 중...' : '추가'}
                </DSButton>
                <DSButton
                  size="small"
                  variant="ghost"
                  onClick={onCancelCreateSection}
                >
                  취소
                </DSButton>
              </div>
              {createSectionError && (
                <p className="text-red-500 text-xs px-4">{createSectionError}</p>
              )}
            </div>
          )}

          {/* 미분류 케이스 (섹션이 있을 때만 별도 표시) */}
          {(sections.length > 0 || uncategorizedCases.length > 0) && uncategorizedCases.length > 0 && (
            <div className="bg-bg-2 border-line-2 rounded-4 overflow-hidden border">
              <div className="border-line-2 flex items-center gap-2 border-b px-4 py-2.5">
                <button
                  type="button"
                  className="flex flex-1 items-center gap-2 text-left"
                  onClick={() => onToggleSection('__uncategorized__')}
                >
                  {collapsedSections.has('__uncategorized__')
                    ? <ChevronRight className="text-text-3 h-4 w-4 shrink-0" />
                    : <ChevronDown className="text-text-3 h-4 w-4 shrink-0" />
                  }
                  <span className="typo-body2-heading text-text-3">미분류</span>
                  <span className="text-text-3 text-xs">{uncategorizedCases.length}개</span>
                </button>
              </div>
              {!collapsedSections.has('__uncategorized__') && (
                <div className="divide-line-2 divide-y">
                  {uncategorizedCases.map((testCase: TestCaseCardType) => (
                    <TestCaseRow
                      key={testCase.id}
                      testCase={testCase}
                      onSelect={onSelectTestCase}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 섹션이 없고 케이스만 있는 경우 (기존 플랫 구조) */}
          {sections.length === 0 && uncategorizedCases.length === 0 && testCases.length > 0 && (
            <div className="bg-bg-2 border-line-2 rounded-4 divide-line-2 divide-y border">
              {testCases.map((testCase: TestCaseCardType) => (
                <TestCaseRow
                  key={testCase.id}
                  testCase={testCase}
                  onSelect={onSelectTestCase}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
