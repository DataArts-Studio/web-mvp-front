'use client';

import React from 'react';

import { ActionToolbar } from '@/widgets';
import { Select } from '@testea/ui';
import { ArrowUpDown, ChevronDown, Plus } from 'lucide-react';

import { MoreActionsMenu } from './more-actions-menu';

export const SORT_OPTIONS = [
  { value: 'custom', label: '커스텀 순서' },
  { value: 'updatedAt-desc', label: '최근 수정 순' },
  { value: 'updatedAt-asc', label: '오래된 수정 순' },
  { value: 'createdAt-desc', label: '최근 생성 순' },
  { value: 'createdAt-asc', label: '오래된 생성 순' },
  { value: 'title-asc', label: '제목 오름차순' },
  { value: 'title-desc', label: '제목 내림차순' },
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
  const currentSortLabel =
    SORT_OPTIONS.find((opt) => opt.value === sortOption)?.label || '최근 수정 순';

  return (
    <div className="bg-bg-1 sticky top-0 z-10 px-6 lg:px-10">
      {/* 1행: 타이틀 + 카운트 + 생성 버튼 */}
      <div className="border-line-2 flex items-center gap-4 border-b pt-5 pb-3">
        <div className="flex min-w-0 flex-1 items-baseline gap-3">
          <h2 className="typo-h2-heading text-text-1 truncate">{title}</h2>
          {totalItems != null && (
            <span className="typo-caption text-text-3 shrink-0">{totalItems}건</span>
          )}
        </div>
        <ActionToolbar.Action
          size="small"
          type="button"
          variant="solid"
          onClick={onCreateClick}
          className="flex shrink-0 items-center gap-2"
          title="테스트 케이스 생성"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span className="hidden leading-none lg:inline">새 케이스</span>
        </ActionToolbar.Action>
      </div>

      {/* 2행: 검색 + 정렬 + 더보기 메뉴 */}
      <div className="flex items-center gap-3 py-3">
        <ActionToolbar.Search
          placeholder="검색..."
          aria-label="테스트 케이스 검색"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <Select.Root
          value={sortOption}
          onValueChange={onSortChange}
          className="relative w-fit shrink-0"
        >
          <Select.Trigger
            aria-label={`정렬: ${currentSortLabel}`}
            className="typo-body2-heading rounded-2 border-line-2 bg-bg-2 text-text-2 hover:bg-bg-3 flex cursor-pointer items-center gap-2 border px-3 py-2 whitespace-nowrap transition-colors"
          >
            <ArrowUpDown className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">정렬: {currentSortLabel}</span>
            <span className="sm:hidden">정렬</span>
            <ChevronDown className="text-text-3 h-4 w-4 shrink-0" aria-hidden="true" />
          </Select.Trigger>
          <Select.Content className="rounded-2 border-line-2 bg-bg-2 absolute top-full left-0 z-50 mt-1 min-w-full border py-1 shadow-lg">
            {SORT_OPTIONS.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                className="typo-body2-normal text-text-2 hover:bg-bg-3 hover:text-text-1 data-[state=checked]:bg-primary/10 data-[state=checked]:text-primary cursor-pointer px-3 py-2 whitespace-nowrap"
              >
                {option.label}
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
  );
};
