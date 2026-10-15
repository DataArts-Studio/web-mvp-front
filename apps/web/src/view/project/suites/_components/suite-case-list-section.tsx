'use client';

import React from 'react';

import { useTranslations } from 'next-intl';

import type { TestCaseCardType } from '@/entities/test-case';
import type { TestSuiteSection } from '@/entities/test-suite-section';
import { DSButton, EmptyState } from '@testea/ui';
import { cn } from '@testea/util';
import { ChevronDown, ListChecks, Plus } from 'lucide-react';

import { SectionCaseList, SuiteSectionGroup } from './suite-section-group';

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
  const isUncategorizedCollapsed = collapsedSections.has('__uncategorized__');
  return (
    <section aria-label={t('ui.includedTestCasesAriaLabel')} className="flex min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 pb-2">
        <h2 className="flex items-baseline gap-2">
          <span className="text-[15px] font-bold text-white">{t('detail.cases')}</span>
          <span className="font-mono text-[12px] text-white/40">{testCases.length}</span>
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onAddCases}
            className="border-line-2 h-8 rounded-[6px] border px-2.5 text-[12px] text-white/80 hover:bg-white/[0.04]"
          >
            {t('detail.addCase')}
          </button>
          <button
            type="button"
            onClick={onStartCreatingSection}
            className="border-line-2 h-8 rounded-[6px] border px-2.5 text-[12px] text-white/80 hover:bg-white/[0.04]"
          >
            {t('detail.addSection')}
          </button>
        </div>
      </div>

      {testCases.length === 0 && sections.length === 0 && !isCreatingSection ? (
        <div className="border-line-2 mt-2 rounded-[8px] border border-dashed">
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
        <div className="flex flex-col">
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
            <div className="mt-1 flex flex-col gap-1">
              <div className="flex items-center gap-2 rounded-[4px] border border-white/10 px-2.5 py-1.5">
                <Plus className="h-3.5 w-3.5 shrink-0 text-white/40" aria-hidden="true" />
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
                  className="flex-1 bg-transparent text-[13px] text-white/90 outline-none placeholder:text-white/35"
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
                <p role="alert" className="text-result-fail px-2.5 text-xs">
                  {createSectionError}
                </p>
              )}
            </div>
          )}

          {/* 섹션이 있을 때, 섹션에 들지 않은 케이스 묶음 */}
          {sections.length > 0 && uncategorizedCases.length > 0 && (
            <div>
              <button
                type="button"
                aria-expanded={!isUncategorizedCollapsed}
                aria-label={t('ui.uncategorizedToggleAriaLabel')}
                className="mt-1 flex w-full items-center gap-2 rounded-[4px] bg-white/[0.04] px-2.5 py-[7px] text-left hover:bg-white/[0.06]"
                onClick={() => onToggleSection('__uncategorized__')}
              >
                <ChevronDown
                  className={cn(
                    'h-3 w-3 shrink-0 text-white/60 transition-transform',
                    isUncategorizedCollapsed && '-rotate-90'
                  )}
                  aria-hidden="true"
                />
                <span className="text-[12px] font-medium text-white/60">
                  {t('detail.noSection')}
                </span>
                <span className="text-[12px] text-white/35">{uncategorizedCases.length}</span>
              </button>
              {!isUncategorizedCollapsed && (
                <SectionCaseList cases={uncategorizedCases} onSelectTestCase={onSelectTestCase} />
              )}
            </div>
          )}

          {/* 섹션이 없으면 머리줄 없이 케이스만 */}
          {sections.length === 0 && (
            <SectionCaseList cases={testCases} onSelectTestCase={onSelectTestCase} />
          )}
        </div>
      )}
    </section>
  );
};
