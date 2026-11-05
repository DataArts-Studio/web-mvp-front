'use client';

import React, { useRef, useState } from 'react';

import { useOutsideClick } from '@testea/lib';
import { cn } from '@testea/util';
import { Check, ChevronDown, X } from 'lucide-react';

import type { RunListTab } from './runs-list-constants';

interface RunsListToolbarProps {
  tab: RunListTab;
  onTabChange: (tab: RunListTab) => void;
  counts: Record<RunListTab, number>;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  milestones: string[];
  milestoneFilter: string | null;
  onMilestoneFilterChange: (value: string | null) => void;
}

const TABS: { value: RunListTab; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'OPEN', label: '진행 중' },
  { value: 'COMPLETED', label: '완료' },
];

export const RunsListToolbar = ({
  tab,
  onTabChange,
  counts,
  searchTerm,
  onSearchChange,
  milestones,
  milestoneFilter,
  onMilestoneFilterChange,
}: RunsListToolbarProps) => {
  const [isMilestoneOpen, setIsMilestoneOpen] = useState(false);
  const milestoneRef = useRef<HTMLDivElement>(null);
  const milestoneMenuId = React.useId();
  useOutsideClick(milestoneRef, () => setIsMilestoneOpen(false), isMilestoneOpen);

  const selectMilestone = (value: string | null) => {
    onMilestoneFilterChange(value);
    setIsMilestoneOpen(false);
  };

  return (
    <div className="border-line-2 flex flex-col gap-2 border-b lg:flex-row lg:items-end lg:gap-4">
      <div role="tablist" aria-label="실행 상태" className="flex items-end gap-1">
        {TABS.map((item) => {
          const active = tab === item.value;
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onTabChange(item.value)}
              className={cn(
                '-mb-px flex items-center gap-2 border-b-2 px-3.5 pt-2 pb-2.5 whitespace-nowrap transition-colors',
                active
                  ? 'border-white/90 text-[14px] font-bold text-white/95'
                  : 'border-transparent text-[14px] font-medium text-white/60 hover:text-white/80'
              )}
            >
              {item.label}
              <span
                className={cn(
                  'text-[13px] font-medium',
                  active ? 'text-white/60' : 'text-white/35'
                )}
              >
                {counts[item.value]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="hidden flex-1 lg:block" />

      <div className="flex flex-wrap items-center gap-4 pb-2">
        <label className="border-line-2 focus-within:border-primary/60 flex w-full items-center gap-2 rounded-[6px] border px-3 py-2 sm:w-[220px]">
          <span className="sr-only">실행 이름 검색</span>
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="실행 이름 검색"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-white/90 outline-none placeholder:text-white/35 [&::-webkit-search-cancel-button]:hidden"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="검색어 지우기"
              className="text-white/35 hover:text-white/70"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </label>

        {milestones.length > 0 && (
          <div className="relative" ref={milestoneRef}>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={isMilestoneOpen}
              aria-controls={isMilestoneOpen ? milestoneMenuId : undefined}
              onClick={() => setIsMilestoneOpen((prev) => !prev)}
              className={cn(
                'flex items-center gap-1 text-[13px] font-medium whitespace-nowrap',
                milestoneFilter ? 'text-primary' : 'text-white/55 hover:text-white/80'
              )}
            >
              마일스톤: <span className="max-w-[160px] truncate">{milestoneFilter ?? '전체'}</span>
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            {isMilestoneOpen && (
              <div
                id={milestoneMenuId}
                role="menu"
                className="border-line-2 bg-bg-2 shadow-2 absolute top-full right-0 z-20 mt-1 max-h-72 min-w-[200px] overflow-y-auto rounded-[6px] border py-1"
              >
                {[null, ...milestones].map((name) => {
                  const checked = milestoneFilter === name;
                  return (
                    <button
                      key={name ?? '__all'}
                      type="button"
                      role="menuitemradio"
                      aria-checked={checked}
                      onClick={() => selectMilestone(name)}
                      className={cn(
                        'hover:bg-bg-3 flex w-full items-center gap-2 px-3 py-2 text-left text-[13px]',
                        checked ? 'text-primary' : 'text-white/75'
                      )}
                    >
                      <Check
                        className={cn('h-3.5 w-3.5 shrink-0', !checked && 'invisible')}
                        aria-hidden="true"
                      />
                      <span className="truncate">{name ?? '전체'}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
