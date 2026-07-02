'use client';

import React from 'react';

import { useTranslations } from 'next-intl';

import type { TestCaseCardType } from '@/entities/test-case';
import type { TestSuiteSection } from '@/entities/test-suite-section';
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
  const t = useTranslations('suites');
  return (
    <section
      aria-label={t('ui.includedTestCasesAriaLabel')}
      className="flex h-full min-h-0 flex-col"
    >
      <div className="border-line-2 flex shrink-0 items-center justify-between border-b pb-3">
        <div>
          <h2 className="text-text-1 text-base font-semibold">{t('ui.includedTestCases')}</h2>
          <p className="text-text-3 mt-0.5 text-xs">
            {t('count.cases', { count: testCases.length })} / ?? {sections.length}?
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DSButton
            variant="ghost"
            size="small"
            className="flex h-8 items-center gap-1 px-2"
            onClick={onStartCreatingSection}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t('ui.addSection')}
          </DSButton>
          {testCases.length > 0 && (
            <DSButton
              variant="ghost"
              size="small"
              className="flex h-8 items-center gap-1 px-2"
              onClick={onAddCases}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t('ui.addCase')}
            </DSButton>
          )}
        </div>
      </div>

      {testCases.length === 0 && sections.length === 0 ? (
        <div className="border-line-2 mt-4 border border-dashed">
          <EmptyState
            icon={<ListChecks className="h-8 w-8" aria-hidden="true" />}
            title={t('ui.noTestCasesTitle')}
            description={t('ui.noTestCasesDescription')}
            action={
              <DSButton
                variant="ghost"
                className="flex h-8 items-center gap-1 px-2"
                onClick={onAddCases}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t('ui.addTestCase')}
              </DSButton>
            }
          />
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto pt-4">
          <div className="flex flex-col gap-2">
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
                <div className="border-line-2 flex items-center gap-2 border px-3 py-2">
                  <Plus className="text-text-3 h-4 w-4 shrink-0" aria-hidden="true" />
                  <input
                    ref={newSectionInputRef}
                    type="text"
                    aria-label={t('ui.newSectionAriaLabel')}
                    value={newSectionName}
                    onChange={(e) => onSetNewSectionName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onCreateSection();
                      if (e.key === 'Escape') onCancelCreateSection();
                    }}
                    placeholder={t('ui.newSectionPlaceholder')}
                    className="typo-body2-normal text-text-1 placeholder:text-text-3 flex-1 bg-transparent outline-none"
                    disabled={createSectionIsPending}
                  />
                  <DSButton
                    size="small"
                    variant="solid"
                    onClick={onCreateSection}
                    disabled={createSectionIsPending || !newSectionName.trim()}
                  >
                    {createSectionIsPending ? t('ui.sectionCreating') : t('ui.sectionAdd')}
                  </DSButton>
                  <DSButton size="small" variant="ghost" onClick={onCancelCreateSection}>
                    {t('ui.cancel')}
                  </DSButton>
                </div>
                {createSectionError && (
                  <p role="alert" className="px-4 text-xs text-red-500">
                    {createSectionError}
                  </p>
                )}
              </div>
            )}

            {/* 미분류 케이스 (섹션이 있을 때만 별도 표시) */}
            {(sections.length > 0 || uncategorizedCases.length > 0) &&
              uncategorizedCases.length > 0 && (
                <div className="border-line-2 overflow-hidden border">
                  <div className="border-line-2 flex items-center gap-2 border-b px-4 py-2.5">
                    <button
                      type="button"
                      aria-expanded={!collapsedSections.has('__uncategorized__')}
                      aria-label={t('ui.uncategorizedToggleAriaLabel')}
                      className="flex flex-1 items-center gap-2 text-left"
                      onClick={() => onToggleSection('__uncategorized__')}
                    >
                      {collapsedSections.has('__uncategorized__') ? (
                        <ChevronRight className="text-text-3 h-4 w-4 shrink-0" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="text-text-3 h-4 w-4 shrink-0" aria-hidden="true" />
                      )}
                      <span className="typo-body2-heading text-text-3">
                        {t('ui.uncategorized')}
                      </span>
                      <span className="text-text-3 text-xs">
                        {t('count.cases', { count: uncategorizedCases.length })}
                      </span>
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
              <div className="border-line-2 divide-line-2 divide-y border">
                {testCases.map((testCase: TestCaseCardType) => (
                  <TestCaseRow key={testCase.id} testCase={testCase} onSelect={onSelectTestCase} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
