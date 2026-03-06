'use client';

import React from 'react';

import { cn } from '@/shared/utils';
import { type TestCaseRunDetail } from '@/features/runs';

import {
  Search,
  ChevronRight,
  ChevronDown,
  MessageSquare,
  FolderOpen,
  Filter,
  X,
  CheckCircle2,
  Minus,
} from 'lucide-react';

import { STATUS_CONFIG, type StatusFilter, type GroupedCases, type TestCaseRunStatus } from './run-detail-constants';

interface RunCaseListPanelProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (filter: StatusFilter) => void;
  suiteFilter: string;
  setSuiteFilter: (filter: string) => void;
  availableSuites: { id: string; name: string }[];
  filteredCases: TestCaseRunDetail[];
  groupedCases: GroupedCases[];
  collapsedGroups: { has: (key: string) => boolean; toggle: (key: string) => void };
  selectedCaseId: string | null;
  setSelectedCaseId: (id: string) => void;
  testRunStats: { total: number; pass: number; fail: number; blocked: number; untested: number };
  showStatusFilterDropdown: boolean;
  setShowStatusFilterDropdown: (show: boolean) => void;
  showSuiteFilterDropdown: boolean;
  setShowSuiteFilterDropdown: (show: boolean) => void;
  statusFilterRef: React.RefObject<HTMLDivElement | null>;
  suiteFilterRef: React.RefObject<HTMLDivElement | null>;
  onRemoveSuite?: (suiteId: string, suiteName: string) => void;
  // 벌크 선택
  selectedCaseIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleGroupSelect: (caseIds: string[]) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkStatusChange: (status: TestCaseRunStatus) => void;
  isBulkUpdating: boolean;
}

export const RunCaseListPanel = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  suiteFilter,
  setSuiteFilter,
  availableSuites,
  filteredCases,
  groupedCases,
  collapsedGroups,
  selectedCaseId,
  setSelectedCaseId,
  testRunStats,
  showStatusFilterDropdown,
  setShowStatusFilterDropdown,
  showSuiteFilterDropdown,
  setShowSuiteFilterDropdown,
  statusFilterRef,
  suiteFilterRef,
  onRemoveSuite,
  selectedCaseIds,
  onToggleSelect,
  onToggleGroupSelect,
  onSelectAll,
  onDeselectAll,
  onBulkStatusChange,
  isBulkUpdating,
}: RunCaseListPanelProps) => {
  const hasSelection = selectedCaseIds.size > 0;
  const allSelected = filteredCases.length > 0 && selectedCaseIds.size === filteredCases.length;

  return (
    <div className="border-line-2 flex w-[60%] flex-col border-r">
      {/* Search & Filter */}
      <div className="border-line-2 flex flex-col gap-3 border-b p-4">
        <div className="relative">
          <Search className="text-text-3 pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <input
            type="text"
            placeholder="케이스 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-bg-2 border-line-2 text-text-1 placeholder:text-text-4 focus:border-primary w-full rounded-lg border py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex gap-2">
          {/* Status Filter Dropdown */}
          <div className="relative flex-1" ref={statusFilterRef}>
            <button
              onClick={() => {
                setShowStatusFilterDropdown(!showStatusFilterDropdown);
                setShowSuiteFilterDropdown(false);
              }}
              className="bg-bg-2 border-line-2 hover:border-line-1 flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors"
            >
              <div className="flex items-center gap-2">
                {statusFilter === 'all' ? (
                  <>
                    <Filter className="text-text-3 h-4 w-4" />
                    <span className="text-text-1">전체 상태</span>
                  </>
                ) : (
                  <>
                    <span className={STATUS_CONFIG[statusFilter].style}>
                      {STATUS_CONFIG[statusFilter].icon}
                    </span>
                    <span className="text-text-1">{STATUS_CONFIG[statusFilter].label}</span>
                    <span className="text-text-3 text-xs">({testRunStats[statusFilter]})</span>
                  </>
                )}
              </div>
              <ChevronDown className={cn('text-text-3 h-4 w-4 transition-transform', showStatusFilterDropdown && 'rotate-180')} />
            </button>

            {showStatusFilterDropdown && (
              <div className="bg-bg-2 border-line-2 absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-lg border shadow-xl">
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setShowStatusFilterDropdown(false);
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors',
                    statusFilter === 'all' ? 'bg-primary/10 text-primary' : 'hover:bg-bg-3'
                  )}
                >
                  <Filter className="h-4 w-4" />
                  <span>전체 상태</span>
                  <span className="text-text-3 ml-auto text-xs">({testRunStats.total})</span>
                </button>
                {(['untested', 'pass', 'fail', 'blocked'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setStatusFilter(status);
                      setShowStatusFilterDropdown(false);
                    }}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors',
                      statusFilter === status ? 'bg-primary/10 text-primary' : 'hover:bg-bg-3'
                    )}
                  >
                    <span className={STATUS_CONFIG[status].style}>{STATUS_CONFIG[status].icon}</span>
                    <span>{STATUS_CONFIG[status].label}</span>
                    <span className="text-text-3 ml-auto text-xs">({testRunStats[status]})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Suite Filter Dropdown */}
          <div className="relative flex-1" ref={suiteFilterRef}>
            <button
              onClick={() => {
                setShowSuiteFilterDropdown(!showSuiteFilterDropdown);
                setShowStatusFilterDropdown(false);
              }}
              className="bg-bg-2 border-line-2 hover:border-line-1 flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors"
            >
              <div className="flex items-center gap-2">
                <FolderOpen className={cn('h-4 w-4', suiteFilter !== 'all' ? 'text-primary' : 'text-text-3')} />
                <span className="text-text-1 truncate">
                  {suiteFilter === 'all'
                    ? '스위트'
                    : availableSuites.find(s => s.id === suiteFilter)?.name || '스위트'}
                </span>
              </div>
              <ChevronDown className={cn('text-text-3 h-4 w-4 flex-shrink-0 transition-transform', showSuiteFilterDropdown && 'rotate-180')} />
            </button>

            {showSuiteFilterDropdown && (
              <div className="bg-bg-2 border-line-2 absolute left-0 right-0 top-full z-30 mt-1 max-h-60 overflow-y-auto rounded-lg border shadow-xl">
                <button
                  onClick={() => {
                    setSuiteFilter('all');
                    setShowSuiteFilterDropdown(false);
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors',
                    suiteFilter === 'all' ? 'bg-primary/10 text-primary' : 'hover:bg-bg-3'
                  )}
                >
                  <FolderOpen className="h-4 w-4" />
                  <span>전체 스위트</span>
                </button>
                {availableSuites.length === 0 ? (
                  <div className="text-text-3 px-3 py-2 text-sm">스위트 없음</div>
                ) : (
                  availableSuites.map((suite) => (
                    <button
                      key={suite.id}
                      onClick={() => {
                        setSuiteFilter(suite.id);
                        setShowSuiteFilterDropdown(false);
                      }}
                      className={cn(
                        'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors',
                        suiteFilter === suite.id ? 'bg-primary/10 text-primary' : 'hover:bg-bg-3'
                      )}
                    >
                      <FolderOpen className="h-4 w-4" />
                      <span className="truncate">{suite.name}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Action Toolbar */}
      {hasSelection && (
        <div className="border-line-2 flex items-center gap-2 border-b bg-primary/5 px-4 py-2">
          <button
            onClick={allSelected ? onDeselectAll : onSelectAll}
            className="text-primary typo-label-normal hover:underline"
          >
            {allSelected ? '선택 해제' : '전체 선택'}
          </button>
          <span className="text-text-3 text-xs">
            {selectedCaseIds.size}개 선택됨
          </span>
          <div className="ml-auto flex items-center gap-1">
            {(['pass', 'fail', 'blocked', 'untested'] as const).map((status) => (
              <button
                key={status}
                onClick={() => onBulkStatusChange(status)}
                disabled={isBulkUpdating}
                className={cn(
                  'flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition-colors',
                  STATUS_CONFIG[status].bgStyle,
                  isBulkUpdating && 'opacity-50 cursor-not-allowed'
                )}
                title={`선택된 케이스를 ${STATUS_CONFIG[status].label}로 변경`}
              >
                {STATUS_CONFIG[status].icon}
                <span className="hidden lg:inline">{STATUS_CONFIG[status].shortcut}</span>
              </button>
            ))}
            <button
              onClick={onDeselectAll}
              className="text-text-3 hover:text-text-1 ml-1 rounded p-1 transition-colors"
              title="선택 해제"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Case List - Grouped by Source */}
      <div className="flex-1 overflow-y-auto">
        {filteredCases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Filter className="text-text-3 mb-2 h-8 w-8" />
            <p className="text-text-2">검색 결과가 없습니다.</p>
          </div>
        ) : (
          groupedCases.map((group) => {
            const isCollapsed = collapsedGroups.has(group.groupKey);
            const groupPass = group.cases.filter(c => c.status === 'pass').length;
            const groupFail = group.cases.filter(c => c.status === 'fail').length;
            const groupBlocked = group.cases.filter(c => c.status === 'blocked').length;

            const groupCaseIds = group.cases.map(c => c.id);
            const groupSelectedCount = groupCaseIds.filter(id => selectedCaseIds.has(id)).length;
            const isGroupAllSelected = groupSelectedCount === group.cases.length;
            const isGroupPartial = groupSelectedCount > 0 && !isGroupAllSelected;

            return (
              <div key={group.groupKey}>
                {/* Suite Group Header */}
                <div
                  className="group/header bg-bg-3/50 border-line-2 sticky top-0 z-10 flex cursor-pointer select-none items-center gap-2 border-b px-3 py-1.5"
                >
                  {/* Group checkbox */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleGroupSelect(groupCaseIds);
                    }}
                    className={cn(
                      'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors',
                      isGroupAllSelected
                        ? 'bg-primary border-primary text-white'
                        : isGroupPartial
                          ? 'bg-primary/30 border-primary text-white'
                          : 'border-line-1 hover:border-primary'
                    )}
                  >
                    {isGroupAllSelected && <CheckCircle2 className="h-3 w-3" />}
                    {isGroupPartial && <Minus className="h-3 w-3" />}
                  </button>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => collapsedGroups.toggle(group.groupKey)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); collapsedGroups.toggle(group.groupKey); } }}
                    className="flex flex-1 items-center gap-2"
                  >
                    <ChevronDown
                      className={cn(
                        'text-text-4 h-3.5 w-3.5 transition-transform',
                        isCollapsed && '-rotate-90'
                      )}
                    />
                    <FolderOpen className="text-text-3 h-3.5 w-3.5" />
                    <span className="text-text-2 flex-1 text-xs font-semibold uppercase tracking-wide">
                      {group.suiteName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    {groupPass > 0 && (
                      <span className="text-green-400/70">{groupPass}P</span>
                    )}
                    {groupFail > 0 && (
                      <span className="text-red-400/70">{groupFail}F</span>
                    )}
                    {groupBlocked > 0 && (
                      <span className="text-amber-400/70">{groupBlocked}B</span>
                    )}
                    <span className="text-text-4">
                      {group.cases.length}
                    </span>
                  </div>
                  {onRemoveSuite && group.suiteId && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onRemoveSuite(group.suiteId!, group.suiteName); }}
                      className="ml-1 flex h-5 w-5 items-center justify-center rounded text-text-4 opacity-0 transition-all hover:bg-system-red/10 hover:text-system-red group-hover/header:opacity-100"
                      title={`${group.suiteName} 스위트 제거`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* Test Case Items */}
                {!isCollapsed && group.cases.map((tc, index) => {
                  const config = STATUS_CONFIG[tc.status];
                  const isSelected = tc.id === selectedCaseId;
                  const isChecked = selectedCaseIds.has(tc.id);

                  return (
                    <div
                      key={tc.id}
                      className={cn(
                        'border-line-2 flex w-full items-center gap-3 border-b py-3 pl-4 pr-4 text-left transition-colors',
                        isSelected ? 'bg-primary/10' : 'hover:bg-bg-2',
                        isChecked && !isSelected && 'bg-primary/5'
                      )}
                    >
                      {/* Checkbox */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSelect(tc.id);
                        }}
                        className={cn(
                          'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors',
                          isChecked
                            ? 'bg-primary border-primary text-white'
                            : 'border-line-1 hover:border-primary'
                        )}
                      >
                        {isChecked && <CheckCircle2 className="h-3 w-3" />}
                      </button>
                      {/* Case content - clickable for detail view */}
                      <button
                        onClick={() => setSelectedCaseId(tc.id)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <span className={cn('flex-shrink-0', config.style)}>{config.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-primary font-mono text-xs">{tc.code || `#${index + 1}`}</span>
                            {tc.comment && <MessageSquare className="text-text-3 h-3 w-3" />}
                          </div>
                          <p className="text-text-1 truncate text-sm">{tc.title || '제목 없음'}</p>
                        </div>
                        {isSelected && <ChevronRight className="text-text-3 h-4 w-4 flex-shrink-0" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
