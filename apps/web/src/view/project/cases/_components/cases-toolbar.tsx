'use client';

import React from 'react';

import { useTranslations } from 'next-intl';

import { Select } from '@testea/ui';
import { ChevronDown } from 'lucide-react';

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
  /** 좁은 화면에서 스위트 패널 대신 쓰는 선택지 */
  suites: { id: string; title: string }[];
  selectedSuiteId: string;
  onSuiteChange: (id: string) => void;
  sortOption: SortValue;
  onSortChange: (value: string) => void;
  onAiGenerate: () => void;
  onAiAnalyze: () => void;
  onImport: () => void;
  onExport: () => void;
}

/** 목록 위 한 줄: 고른 스위트 이름·건수, 정렬, 더 보기 */
export const CasesToolbar = ({
  title,
  totalItems,
  suites,
  selectedSuiteId,
  onSuiteChange,
  sortOption,
  onSortChange,
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
    <div className="bg-bg-1 sticky top-0 z-10 flex flex-wrap items-center gap-3 px-4 pt-5 pb-3 md:px-6">
      <div className="flex min-w-0 flex-1 items-baseline gap-2">
        <h2 className="truncate text-[15px] font-bold text-white">{title}</h2>
        {totalItems != null && (
          <span className="shrink-0 font-mono text-[12px] text-white/40">{totalItems}</span>
        )}
      </div>

      <label className="md:hidden">
        <span className="sr-only">{t('ui.suiteFilterAriaLabel')}</span>
        <select
          value={selectedSuiteId}
          onChange={(e) => onSuiteChange(e.target.value)}
          className="border-line-2 bg-bg-1 h-8 max-w-[160px] rounded-[6px] border px-2 text-[12px] text-white/80"
        >
          <option value="all">{t('ui.allCases')}</option>
          {suites.map((suite) => (
            <option key={suite.id} value={suite.id}>
              {suite.title}
            </option>
          ))}
          <option value="__uncategorized__">{t('ui.uncategorized')}</option>
        </select>
      </label>

      <Select.Root
        value={sortOption}
        onValueChange={onSortChange}
        className="relative w-fit shrink-0"
      >
        <Select.Trigger
          aria-label={t('ui.sortAriaLabel', { label: currentSortLabel })}
          className="border-line-2 flex h-8 cursor-pointer items-center gap-1.5 rounded-[6px] border px-2.5 text-[12px] whitespace-nowrap text-white/80 transition-colors hover:bg-white/[0.04]"
        >
          {currentSortLabel}
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-white/50" aria-hidden="true" />
        </Select.Trigger>
        <Select.Content className="rounded-2 border-line-2 bg-bg-2 absolute top-full right-0 z-50 mt-1 min-w-full border py-1 shadow-lg">
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
  );
};
