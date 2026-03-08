'use client';

import React, { useRef } from 'react';
import {
  Search,
  Filter,
  ChevronDown,
  CheckCircle2,
  ArrowUpDown,
  X,
} from 'lucide-react';
import { useOutsideClick } from '@/shared/hooks';
import { type RunStatusFilter, type RunSortOption, getStatusFilterLabel } from './runs-list-constants';

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
    <section className="col-span-6 flex items-center justify-between gap-4">
      {/* 검색창 */}
      <div className="flex flex-1 items-center gap-3">
        <div className="relative w-full max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-3">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="실행 이름 검색..."
            className="typo-body2-normal w-full rounded-2 border border-line-2 bg-bg-2 py-2 pl-10 pr-10 text-text-1 placeholder:text-text-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-3 hover:text-text-1 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* 상태 필터 드롭다운 */}
        <div className="relative" ref={statusDropdownRef}>
          <button
            onClick={onStatusDropdownToggle}
            className={`typo-body2-heading flex items-center gap-2 rounded-2 border px-3 py-2 transition-colors ${
              statusFilter !== 'ALL'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-line-2 bg-bg-2 text-text-2 hover:bg-bg-3'
            }`}
          >
            <Filter className="h-4 w-4" />
            <span>{getStatusFilterLabel(statusFilter)}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isStatusDropdownOpen && (
            <div className="absolute right-0 top-full z-10 mt-1 min-w-[160px] overflow-hidden rounded-2 border border-line-2 bg-bg-2 shadow-2">
              {(['ALL', 'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] as RunStatusFilter[]).map((status) => (
                <button
                  key={status}
                  onClick={() => onStatusFilterChange(status)}
                  className={`typo-body2-normal flex w-full items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-bg-3 ${
                    statusFilter === status ? 'bg-bg-3 text-primary' : 'text-text-2'
                  }`}
                >
                  {statusFilter === status && <CheckCircle2 className="h-4 w-4" />}
                  <span className={statusFilter === status ? '' : 'pl-6'}>
                    {getStatusFilterLabel(status)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 정렬 드롭다운 */}
        <div className="relative" ref={sortDropdownRef}>
          <button
            onClick={onSortDropdownToggle}
            className="typo-body2-heading flex items-center gap-2 rounded-2 border border-line-2 bg-bg-2 px-3 py-2 text-text-2 hover:bg-bg-3 transition-colors"
          >
            <ArrowUpDown className="h-4 w-4" />
            <span>{sortOption === 'UPDATED' ? '최근 수정 순' : '이름 순'}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isSortDropdownOpen && (
            <div className="absolute right-0 top-full z-10 mt-1 min-w-[160px] overflow-hidden rounded-2 border border-line-2 bg-bg-2 shadow-2">
              <button
                onClick={() => onSortOptionChange('UPDATED')}
                className={`typo-body2-normal flex w-full items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-bg-3 ${
                  sortOption === 'UPDATED' ? 'bg-bg-3 text-primary' : 'text-text-2'
                }`}
              >
                {sortOption === 'UPDATED' && <CheckCircle2 className="h-4 w-4" />}
                <span className={sortOption === 'UPDATED' ? '' : 'pl-6'}>최근 수정 순</span>
              </button>
              <button
                onClick={() => onSortOptionChange('NAME')}
                className={`typo-body2-normal flex w-full items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-bg-3 ${
                  sortOption === 'NAME' ? 'bg-bg-3 text-primary' : 'text-text-2'
                }`}
              >
                {sortOption === 'NAME' && <CheckCircle2 className="h-4 w-4" />}
                <span className={sortOption === 'NAME' ? '' : 'pl-6'}>이름 순</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
