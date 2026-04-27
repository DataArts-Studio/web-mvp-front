'use client';

import React from 'react';
import { Plus, ArrowUpDown, ChevronDown } from 'lucide-react';
import { Select } from '@testea/ui';
import { ActionToolbar } from '@/widgets';
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
  onImport,
  onExport,
}: CasesToolbarProps) => {
  const currentSortLabel = SORT_OPTIONS.find((opt) => opt.value === sortOption)?.label || '최근 수정 순';

  return (
    <div className="sticky top-0 z-10 bg-bg-1 px-6 lg:px-10">
      {/* 1행: 타이틀 + 카운트 + 생성 버튼 */}
      <div className="flex items-center gap-4 pt-5 pb-3 border-b border-line-2">
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
          <Plus className="h-4 w-4" />
          <span className="hidden lg:inline leading-none">새 케이스</span>
        </ActionToolbar.Action>
      </div>

      {/* 2행: 검색 + 정렬 + 더보기 메뉴 */}
      <div className="flex items-center gap-3 py-3">
        <ActionToolbar.Search
          placeholder="검색..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <Select.Root value={sortOption} onValueChange={onSortChange} className="relative shrink-0 w-fit">
          <Select.Trigger className="typo-body2-heading rounded-2 border-line-2 bg-bg-2 text-text-2 hover:bg-bg-3 flex items-center gap-2 border px-3 py-2 transition-colors cursor-pointer whitespace-nowrap">
            <ArrowUpDown className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">정렬: {currentSortLabel}</span>
            <span className="sm:hidden">정렬</span>
            <ChevronDown className="text-text-3 h-4 w-4 shrink-0" />
          </Select.Trigger>
          <Select.Content className="absolute top-full left-0 min-w-full mt-1 z-50 rounded-2 border border-line-2 bg-bg-2 py-1 shadow-lg">
            {SORT_OPTIONS.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                className="typo-body2-normal px-3 py-2 text-text-2 hover:bg-bg-3 hover:text-text-1 cursor-pointer data-[state=checked]:bg-primary/10 data-[state=checked]:text-primary whitespace-nowrap"
              >
                {option.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>

        <MoreActionsMenu onAiGenerate={onAiGenerate} onImport={onImport} onExport={onExport} />
      </div>
    </div>
  );
};
