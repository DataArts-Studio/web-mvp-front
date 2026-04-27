'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/shared/utils';
import type { TrashItemType } from '@/features/trash';
import { FILTER_OPTIONS } from './trash-constants';

interface TrashToolbarProps {
  filterType: 'all' | TrashItemType;
  onFilterChange: (value: 'all' | TrashItemType) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  typeCounts: Record<string, number>;
}

export function TrashToolbar({
  filterType,
  onFilterChange,
  searchQuery,
  onSearchChange,
  typeCounts,
}: TrashToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex gap-1">
        {FILTER_OPTIONS.map((opt) => {
          const count = typeCounts[opt.value] ?? 0;
          const isActive = filterType === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onFilterChange(opt.value)}
              className={cn(
                'typo-body2-normal flex items-center gap-1.5 rounded-lg px-3 py-2 transition-colors',
                isActive
                  ? 'bg-bg-3 text-text-1 font-medium'
                  : 'text-text-3 hover:text-text-2 hover:bg-bg-2',
              )}
            >
              {opt.label}
              <span
                className={cn(
                  'typo-label-normal rounded-full px-1.5 py-0.5 min-w-[20px] text-center',
                  isActive ? 'bg-bg-4 text-text-2' : 'bg-bg-2 text-text-3',
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="border-line-2 flex items-center gap-2 rounded-lg border bg-bg-2 px-3 py-2">
        <Search className="h-4 w-4 text-text-3" />
        <input
          type="text"
          placeholder="검색..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="typo-body2-normal text-text-1 placeholder:text-text-3 w-48 bg-transparent focus:outline-none"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="text-text-3 hover:text-text-2"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
