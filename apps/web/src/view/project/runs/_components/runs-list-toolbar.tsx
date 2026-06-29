'use client';

import React, { useRef } from 'react';

import { useOutsideClick } from '@testea/lib';
import { ArrowUpDown, CheckCircle2, ChevronDown, Filter, Search, X } from 'lucide-react';

import {
  type RunSortOption,
  type RunStatusFilter,
  getStatusFilterLabel,
} from './runs-list-constants';

interface RunsListToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: RunStatusFilter;
  onStatusFilterChange: (value: RunStatusFilter) => void;
  sortOption: RunSortOption;
  onSortOptionChange: (value: RunSortOption) => void;
  isSortDropdownOpen: boolean;
  onSortDropdownToggle: () => void;
  onSortDropdownClose: () => void;
  isStatusDropdownOpen: boolean;
  onStatusDropdownToggle: () => void;
  onStatusDropdownClose: () => void;
}

export const RunsListToolbar = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortOption,
  onSortOptionChange,
  isSortDropdownOpen,
  onSortDropdownToggle,
  onSortDropdownClose,
  isStatusDropdownOpen,
  onStatusDropdownToggle,
  onStatusDropdownClose,
}: RunsListToolbarProps) => {
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  useOutsideClick(sortDropdownRef, onSortDropdownClose);
  useOutsideClick(statusDropdownRef, onStatusDropdownClose);

  return (
    <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:justify-end">
      <label className="relative min-w-0 flex-1 lg:max-w-[520px]">
        <span className="sr-only">실행 이름 검색</span>
        <Search
          aria-hidden="true"
          className="text-text-4 pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
          strokeWidth={1.8}
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="실행 이름 검색..."
          className="typo-body2-normal border-line-2 bg-bg-2 text-text-1 placeholder:text-text-4 focus:border-primary focus:ring-primary h-9 w-full border pr-9 pl-9 transition-colors outline-none focus:ring-1"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="text-text-4 hover:text-text-1 absolute inset-y-0 right-0 flex items-center pr-3 transition-colors"
            aria-label="검색어 지우기"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </label>

      <div className="flex shrink-0 items-center gap-2">
        <div className="relative" ref={statusDropdownRef}>
          <button
            type="button"
            onClick={onStatusDropdownToggle}
            className={`typo-body2-heading inline-flex h-9 items-center gap-2 border px-3 transition-colors ${
              statusFilter !== 'ALL'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-line-2 bg-bg-2 text-text-2 hover:bg-bg-3'
            }`}
          >
            <Filter className="h-4 w-4" aria-hidden="true" />
            <span>{getStatusFilterLabel(statusFilter)}</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>

          {isStatusDropdownOpen && (
            <div className="border-line-2 bg-bg-2 shadow-2 absolute top-full right-0 z-10 mt-1 min-w-[160px] overflow-hidden border">
              {(['ALL', 'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] as RunStatusFilter[]).map(
                (status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => onStatusFilterChange(status)}
                    className={`typo-body2-normal hover:bg-bg-3 flex w-full items-center gap-2 px-4 py-2.5 text-left transition-colors ${
                      statusFilter === status ? 'bg-bg-3 text-primary' : 'text-text-2'
                    }`}
                  >
                    {statusFilter === status && <CheckCircle2 className="h-4 w-4" />}
                    <span className={statusFilter === status ? '' : 'pl-6'}>
                      {getStatusFilterLabel(status)}
                    </span>
                  </button>
                )
              )}
            </div>
          )}
        </div>

        <div className="relative" ref={sortDropdownRef}>
          <button
            type="button"
            onClick={onSortDropdownToggle}
            className="typo-body2-heading border-line-2 bg-bg-2 text-text-2 hover:bg-bg-3 inline-flex h-9 items-center gap-2 border px-3 transition-colors"
          >
            <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
            <span>{sortOption === 'UPDATED' ? '최근 수정 순' : '이름 순'}</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>

          {isSortDropdownOpen && (
            <div className="border-line-2 bg-bg-2 shadow-2 absolute top-full right-0 z-10 mt-1 min-w-[160px] overflow-hidden border">
              {(
                [
                  ['UPDATED', '최근 수정 순'],
                  ['NAME', '이름 순'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onSortOptionChange(value)}
                  className={`typo-body2-normal hover:bg-bg-3 flex w-full items-center gap-2 px-4 py-2.5 text-left transition-colors ${
                    sortOption === value ? 'bg-bg-3 text-primary' : 'text-text-2'
                  }`}
                >
                  {sortOption === value && <CheckCircle2 className="h-4 w-4" />}
                  <span className={sortOption === value ? '' : 'pl-6'}>{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
