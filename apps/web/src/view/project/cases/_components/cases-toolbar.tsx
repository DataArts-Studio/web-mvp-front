'use client';

import React from 'react';

import { useTranslations } from 'next-intl';

import { Select } from '@testea/ui';
import { ArrowUpDown, ChevronDown, Plus, Search, X } from 'lucide-react';

import { MoreActionsMenu } from './more-actions-menu';

export const SORT_OPTIONS = [
  { value: 'custom', labelKey: 'custom' },
  { value: 'updatedAt-desc', labelKey: 'updatedAtDesc' },
  { value: 'updatedAt-asc', labelKey: 'updatedAtAsc' },
  { value: 'createdAt-desc', labelKey: 'createdAtDesc' },
  { value: 'createdAt-asc', labelKey: 'createdAtAsc' },
  { value: 'title-asc', labelKey: 'titleAsc' },
  { value: 'title-desc', labelKey: 'titleDesc' },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]['value'];

interface CasesToolbarProps {
  title: string;
  totalItems?: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sortOption: SortValue;
  onSortChange: (value: string) => void;
  onCreateClick: () => void;
  onAiGenerate: () => void;
  onAiAnalyze: () => void;
  onImport: () => void;
  onExport: () => void;
}

export const CasesToolbar = ({
  title,
  totalItems,
  searchQuery,
  onSearchChange,
  sortOption,
  onSortChange,
  onCreateClick,
  onAiGenerate,
  onAiAnalyze,
  onImport,
  onExport,
}: CasesToolbarProps) => {
  const t = useTranslations('cases');
  const currentSortKey =
    SORT_OPTIONS.find((opt) => opt.value === sortOption)?.labelKey || 'updatedAtDesc';
  const currentSortLabel = t(`ui.sortOptions.${currentSortKey}`);

  return (
    <div className="bg-bg-1 sticky top-0 z-10 px-6 lg:px-10">
      <div className="border-line-2 flex items-center gap-3 border-b pt-5 pb-3">
        <div className="flex min-w-0 flex-1 items-baseline gap-3">
          <h2 className="typo-h2-heading text-text-1 truncate">{title}</h2>
          {totalItems != null && (
            <span className="typo-caption text-text-3 shrink-0">
              {t('count.items', { count: totalItems })}
            </span>
          )}
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-2 py-3">
        <button
          type="button"
          onClick={onCreateClick}
          className="typo-body2-heading bg-primary hover:bg-primary/90 inline-flex h-9 shrink-0 items-center justify-center gap-2 px-3 text-white transition-colors"
          title={t('ui.createCase')}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span className="hidden leading-none lg:inline">{t('ui.newCase')}</span>
        </button>

        <label className="relative min-w-0 flex-1 md:max-w-[520px]">
          <span className="sr-only">{t('ui.searchAriaLabel')}</span>
          <Search
            className="text-text-4 pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder={t('ui.search')}
            aria-label={t('ui.searchAriaLabel')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="typo-body2-normal border-line-2 bg-bg-1 text-text-1 placeholder:text-text-4 focus:border-primary focus:ring-primary h-9 w-full border pr-9 pl-9 transition-colors outline-none focus:ring-1"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="text-text-4 hover:text-text-1 absolute inset-y-0 right-0 flex items-center pr-3 transition-colors"
              aria-label="검색어 지우기"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </label>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Select.Root
            value={sortOption}
            onValueChange={onSortChange}
            className="relative w-fit shrink-0"
          >
            <Select.Trigger
              aria-label={t('ui.sortAriaLabel', { label: currentSortLabel })}
              className="typo-body2-heading border-line-2 bg-bg-1 text-text-2 hover:bg-bg-2 inline-flex h-9 cursor-pointer items-center gap-2 border px-3 whitespace-nowrap transition-colors"
            >
              <ArrowUpDown className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">
                {t('ui.sortLabel', { label: currentSortLabel })}
              </span>
              <span className="sm:hidden">{t('ui.sortShort')}</span>
              <ChevronDown className="text-text-3 h-4 w-4 shrink-0" aria-hidden="true" />
            </Select.Trigger>
            <Select.Content className="border-line-2 bg-bg-2 absolute top-full left-0 z-50 mt-1 min-w-full border py-1 shadow-lg">
              {SORT_OPTIONS.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  className="typo-body2-normal text-text-2 hover:bg-bg-3 hover:text-text-1 data-[state=checked]:bg-primary/10 data-[state=checked]:text-primary cursor-pointer px-3 py-2 whitespace-nowrap"
                >
                  {t(`ui.sortOptions.${option.labelKey}`)}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>

          <MoreActionsMenu
            onAiGenerate={onAiGenerate}
            onAiAnalyze={onAiAnalyze}
            onImport={onImport}
            onExport={onExport}
          />
        </div>
      </div>
    </div>
  );
};
