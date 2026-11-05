'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { type TestCaseRunDetail } from '@/features/runs';
import { useOutsideClick } from '@testea/lib';
import { DsCheckbox } from '@testea/ui';
import { cn } from '@testea/util';
import { Check, ChevronDown, Filter, X } from 'lucide-react';

import {
  type GroupedCases,
  RESULT_META,
  RESULT_ORDER,
  type StatusFilter,
  type TestCaseRunStatus,
} from './run-detail-constants';

interface BulkSelection {
  selectedIds: Set<string>;
  toggle: (id: string) => void;
  toggleGroup: (ids: string[]) => void;
  selectAll: (ids: string[]) => void;
  has: (id: string) => boolean;
  clear: () => void;
  count: number;
}

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
  onRemoveSuite?: (suiteId: string, suiteName: string) => void;
  /** 실행에 직접 연결된 스위트. 이 그룹에만 제거 버튼을 보인다 (#375). */
  removableSuiteIds?: ReadonlySet<string>;
  // 벌크 선택
  bulkSelection: BulkSelection;
  filteredCaseIds: string[];
  onBulkStatusChange: (status: TestCaseRunStatus) => void;
  isBulkUpdating: boolean;
  // 인라인 상태 변경
  onInlineStatusChange: (caseId: string, status: TestCaseRunStatus) => void;
}

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'untested', label: '미실행' },
  { value: 'fail', label: '실패' },
  { value: 'blocked', label: '차단' },
  { value: 'pass', label: '통과' },
];

const CHECKBOX_CLASS =
  'border-white/40 bg-transparent rounded-[3px] focus:ring-offset-0 data-[state=checked]:border-primary';

const countByStatus = (cases: TestCaseRunDetail[]) => {
  const counts = { pass: 0, fail: 0, blocked: 0, untested: 0 };
  for (const tc of cases) counts[tc.status] += 1;
  return counts;
};

const GroupCount = ({ label, value, tone }: { label: string; value: number; tone: string }) => (
  <span className="flex items-center gap-1">
    <span className="text-white/50">{label}</span>
    <span className={cn('font-bold', value > 0 ? tone : 'text-white/30')}>{value}</span>
  </span>
);

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
  onRemoveSuite,
  removableSuiteIds,
  bulkSelection,
  filteredCaseIds,
  onBulkStatusChange,
  isBulkUpdating,
  onInlineStatusChange,
}: RunCaseListPanelProps) => {
  const [inlineDropdownId, setInlineDropdownId] = useState<string | null>(null);
  const [inlineDropdownAnchor, setInlineDropdownAnchor] = useState<{
    top: number;
    right: number;
  } | null>(null);
  const inlineDropdownTriggerRef = useRef<HTMLDivElement>(null);
  const inlineDropdownContentRef = useRef<HTMLDivElement>(null);
  const [showSuiteMenu, setShowSuiteMenu] = useState(false);
  const suiteMenuRef = useRef<HTMLDivElement>(null);
  const suiteMenuId = React.useId();
  useOutsideClick(suiteMenuRef, () => setShowSuiteMenu(false), showSuiteMenu);

  useEffect(() => {
    if (!inlineDropdownId) return;
    const close = () => {
      setInlineDropdownId(null);
      setInlineDropdownAnchor(null);
    };
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (inlineDropdownTriggerRef.current?.contains(target)) return;
      if (inlineDropdownContentRef.current?.contains(target)) return;
      close();
    };
    document.addEventListener('mousedown', onMouseDown);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [inlineDropdownId]);

  const selecting = bulkSelection.count > 0;
  const allSelected = filteredCases.length > 0 && bulkSelection.count === filteredCases.length;

  // 그룹별 선택 상태를 한 번에 계산 (렌더 시 그룹마다 반복 방지)
  const groupSelectionState = useMemo(() => {
    const result = new Map<string, { allSelected: boolean; partial: boolean; caseIds: string[] }>();
    for (const group of groupedCases) {
      const caseIds = group.cases.map((c) => c.id);
      let selectedCount = 0;
      for (const id of caseIds) {
        if (bulkSelection.selectedIds.has(id)) selectedCount++;
      }
      result.set(group.groupKey, {
        allSelected: selectedCount === caseIds.length,
        partial: selectedCount > 0 && selectedCount < caseIds.length,
        caseIds,
      });
    }
    return result;
  }, [groupedCases, bulkSelection.selectedIds]);

  const suiteLabel =
    suiteFilter === 'all'
      ? '전체'
      : (availableSuites.find((s) => s.id === suiteFilter)?.name ?? '전체');

  return (
    <div className="border-line-2 flex w-full min-w-0 flex-col overflow-hidden border-r lg:w-[47%]">
      {/* 검색 · 스위트 · 결과 탭 */}
      <div className="flex flex-col px-4 pt-3.5 md:px-8">
        <div className="flex items-center gap-2.5">
          <label className="border-line-2 focus-within:border-primary/60 flex min-w-0 flex-1 items-center gap-2 rounded-[6px] border px-3 py-[7px]">
            <span className="sr-only">케이스 검색</span>
            <input
              type="search"
              placeholder="케이스 키, 제목 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-[13px] text-white/90 outline-none placeholder:text-white/35 [&::-webkit-search-cancel-button]:hidden"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="검색어 지우기"
                className="text-white/35 hover:text-white/70"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </label>

          <div className="relative shrink-0" ref={suiteMenuRef}>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={showSuiteMenu}
              aria-controls={showSuiteMenu ? suiteMenuId : undefined}
              onClick={() => setShowSuiteMenu((prev) => !prev)}
              className={cn(
                'flex items-center gap-1 text-[12px] font-medium whitespace-nowrap',
                suiteFilter !== 'all' ? 'text-primary' : 'text-white/55 hover:text-white/80'
              )}
            >
              스위트: <span className="max-w-[120px] truncate">{suiteLabel}</span>
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            {showSuiteMenu && (
              <div
                id={suiteMenuId}
                role="menu"
                className="border-line-2 bg-bg-2 shadow-2 absolute top-full right-0 z-30 mt-1 max-h-72 min-w-[200px] overflow-y-auto rounded-[6px] border py-1"
              >
                {[{ id: 'all', name: '전체' }, ...availableSuites].map((suite) => {
                  const checked = suiteFilter === suite.id;
                  return (
                    <button
                      key={suite.id}
                      type="button"
                      role="menuitemradio"
                      aria-checked={checked}
                      onClick={() => {
                        setSuiteFilter(suite.id);
                        setShowSuiteMenu(false);
                      }}
                      className={cn(
                        'hover:bg-bg-3 flex w-full items-center gap-2 px-3 py-2 text-left text-[13px]',
                        checked ? 'text-primary' : 'text-white/75'
                      )}
                    >
                      <Check
                        className={cn('h-3.5 w-3.5 shrink-0', !checked && 'invisible')}
                        aria-hidden="true"
                      />
                      <span className="truncate">{suite.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div role="tablist" aria-label="결과별 보기" className="flex flex-wrap gap-x-4 py-3">
          {STATUS_TABS.map((tab) => {
            const active = statusFilter === tab.value;
            const count = tab.value === 'all' ? testRunStats.total : testRunStats[tab.value];
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setStatusFilter(tab.value)}
                className={cn(
                  'flex items-center gap-1.5 text-[12px] whitespace-nowrap',
                  active ? 'font-bold text-white/95' : 'text-white/55 hover:text-white/80'
                )}
              >
                {tab.label}
                <span className={active ? 'text-white/60' : 'text-white/35'}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 일괄 변경 줄 */}
      {selecting && (
        <div
          role="toolbar"
          aria-label="선택한 케이스 일괄 변경"
          className="mx-4 mb-1.5 flex flex-wrap items-center gap-2 rounded-[4px] bg-white/[0.04] px-3 py-1.5 md:mx-8"
        >
          <DsCheckbox
            checked={allSelected}
            onCheckedChange={() =>
              allSelected ? bulkSelection.clear() : bulkSelection.selectAll(filteredCaseIds)
            }
            aria-label={allSelected ? '전체 선택 해제' : '보이는 케이스 전체 선택'}
            className={CHECKBOX_CLASS}
          />
          <span className="text-[12px] font-bold text-white/90">{bulkSelection.count}건 선택</span>
          <span className="ml-2 text-[11px] text-white/40">일괄 변경</span>
          {RESULT_ORDER.map((status) => {
            const meta = RESULT_META[status];
            return (
              <button
                key={status}
                type="button"
                onClick={() => onBulkStatusChange(status)}
                disabled={isBulkUpdating}
                className={cn(
                  'flex items-center gap-1.5 rounded-[4px] border border-current/40 px-2 py-0.5 text-[12px] font-medium disabled:opacity-50',
                  status === 'untested' ? 'text-white/80' : meta.text
                )}
                title={`선택한 케이스를 ${meta.label}(으)로 변경`}
              >
                {meta.label}
                <kbd className="font-mono text-[9px] text-white/30">{meta.shortcut}</kbd>
              </button>
            );
          })}
          <div className="flex-1" />
          <button
            type="button"
            onClick={bulkSelection.clear}
            className="text-[11px] text-white/50 hover:text-white/80"
          >
            선택 해제
          </button>
        </div>
      )}

      {/* 케이스 목록 (스위트별 묶음) */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 md:px-8">
        {filteredCases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Filter className="mb-2 h-8 w-8 text-white/30" aria-hidden="true" />
            <p className="text-[13px] text-white/60">조건에 맞는 케이스가 없습니다.</p>
          </div>
        ) : (
          groupedCases.map((group, groupIndex) => {
            const isCollapsed = collapsedGroups.has(group.groupKey);
            const counts = countByStatus(group.cases);
            const total = group.cases.length;
            const pct = (n: number) => `${(n / total) * 100}%`;
            const groupState = groupSelectionState.get(group.groupKey)!;
            const canRemove =
              onRemoveSuite && group.suiteId && removableSuiteIds?.has(group.suiteId);

            return (
              <section key={group.groupKey} className={cn(groupIndex > 0 && 'mt-2')}>
                {/* 스위트 머리 */}
                <div className="group/header relative flex items-center gap-2.5 overflow-hidden rounded-[4px] bg-white/[0.03] py-[7px] pr-2.5 pl-[34px]">
                  <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex">
                    <div className="bg-result-pass/[0.07]" style={{ width: pct(counts.pass) }} />
                    <div className="bg-result-fail/[0.09]" style={{ width: pct(counts.fail) }} />
                    <div
                      className="bg-result-blocked/[0.09]"
                      style={{ width: pct(counts.blocked) }}
                    />
                  </div>
                  <span
                    className={cn(
                      'absolute top-1/2 left-2.5 z-10 flex -translate-y-1/2 transition-opacity',
                      selecting || groupState.allSelected || groupState.partial
                        ? 'opacity-100'
                        : 'opacity-0 group-focus-within/header:opacity-100 group-hover/header:opacity-100'
                    )}
                  >
                    <DsCheckbox
                      checked={groupState.allSelected}
                      onCheckedChange={() => bulkSelection.toggleGroup(groupState.caseIds)}
                      aria-label={`${group.suiteName} 케이스 전체 선택`}
                      className={cn(
                        CHECKBOX_CLASS,
                        groupState.partial && 'border-primary bg-primary/40'
                      )}
                    />
                  </span>
                  <button
                    type="button"
                    onClick={() => collapsedGroups.toggle(group.groupKey)}
                    aria-expanded={!isCollapsed}
                    className="relative flex min-w-0 flex-1 items-center gap-2.5 text-left"
                  >
                    <ChevronDown
                      className={cn(
                        'h-3.5 w-3.5 shrink-0 text-white/50 transition-transform',
                        isCollapsed && '-rotate-90'
                      )}
                      aria-hidden="true"
                    />
                    <span className="truncate text-[13px] font-bold text-white/90">
                      {group.suiteName}
                    </span>
                  </button>
                  <p className="relative hidden items-center gap-3 text-[11px] whitespace-nowrap sm:flex">
                    <GroupCount label="통과" value={counts.pass} tone="text-result-pass" />
                    <GroupCount label="실패" value={counts.fail} tone="text-result-fail" />
                    <GroupCount label="차단" value={counts.blocked} tone="text-result-blocked" />
                    <GroupCount label="남음" value={counts.untested} tone="text-white/75" />
                  </p>
                  {canRemove && (
                    <button
                      type="button"
                      onClick={() => onRemoveSuite!(group.suiteId!, group.suiteName)}
                      className="hover:text-system-red relative flex h-5 w-5 items-center justify-center rounded text-white/40 opacity-0 transition-opacity group-focus-within/header:opacity-100 group-hover/header:opacity-100"
                      aria-label={`${group.suiteName} 스위트를 실행에서 빼기`}
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
                    </button>
                  )}
                </div>

                {/* 케이스 행 */}
                {!isCollapsed && (
                  <ul>
                    {group.cases.map((tc) => {
                      const meta = RESULT_META[tc.status];
                      const isSelected = tc.id === selectedCaseId;
                      const isChecked = bulkSelection.selectedIds.has(tc.id);

                      return (
                        <li
                          key={tc.id}
                          className={cn(
                            'group/row border-line-2 relative flex items-center gap-3 border-b py-[9px] pr-2.5 pl-[34px]',
                            meta.rowBg
                          )}
                        >
                          {isSelected && (
                            <div
                              aria-hidden="true"
                              className="pointer-events-none absolute inset-0 bg-white/[0.06]"
                            />
                          )}
                          <span
                            className={cn(
                              'absolute top-1/2 left-2.5 z-10 flex -translate-y-1/2 transition-opacity',
                              selecting || isChecked
                                ? 'opacity-100'
                                : 'opacity-0 group-focus-within/row:opacity-100 group-hover/row:opacity-100'
                            )}
                          >
                            <DsCheckbox
                              checked={isChecked}
                              onCheckedChange={() => bulkSelection.toggle(tc.id)}
                              aria-label={`${tc.code} 선택`}
                              className={CHECKBOX_CLASS}
                            />
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedCaseId(tc.id)}
                            aria-current={isSelected ? 'true' : undefined}
                            className="relative flex min-w-0 flex-1 items-center gap-3 text-left"
                          >
                            <span className="shrink-0 font-mono text-[11px] font-medium text-white/40">
                              {tc.code}
                            </span>
                            <span
                              className={cn(
                                'truncate text-[13px]',
                                isSelected
                                  ? 'font-medium text-white'
                                  : tc.status === 'untested'
                                    ? 'text-white/75'
                                    : 'text-white/90'
                              )}
                            >
                              {tc.title || '제목 없음'}
                            </span>
                          </button>
                          {tc.comment && (
                            <span className="relative shrink-0 text-[11px] text-white/35">
                              메모
                            </span>
                          )}
                          <div
                            className="relative flex w-11 shrink-0 justify-end"
                            ref={inlineDropdownId === tc.id ? inlineDropdownTriggerRef : undefined}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                if (inlineDropdownId === tc.id) {
                                  setInlineDropdownId(null);
                                  setInlineDropdownAnchor(null);
                                  return;
                                }
                                const rect = e.currentTarget.getBoundingClientRect();
                                setInlineDropdownAnchor({
                                  top: rect.bottom + 4,
                                  right: window.innerWidth - rect.right,
                                });
                                setInlineDropdownId(tc.id);
                              }}
                              aria-haspopup="menu"
                              aria-expanded={inlineDropdownId === tc.id}
                              aria-label={`${tc.code} 결과: ${meta.label} (눌러서 바꾸기)`}
                              className={cn(
                                'rounded-[3px] px-1 text-[12px] font-medium whitespace-nowrap hover:bg-white/10',
                                meta.text
                              )}
                            >
                              {meta.label}
                            </button>
                            {inlineDropdownId === tc.id &&
                              inlineDropdownAnchor &&
                              typeof document !== 'undefined' &&
                              createPortal(
                                <div
                                  ref={inlineDropdownContentRef}
                                  role="menu"
                                  style={{
                                    position: 'fixed',
                                    top: inlineDropdownAnchor.top,
                                    right: inlineDropdownAnchor.right,
                                  }}
                                  className="bg-bg-2 border-line-2 z-50 w-32 overflow-hidden rounded-[6px] border py-1 shadow-xl"
                                >
                                  {RESULT_ORDER.map((s) => (
                                    <button
                                      key={s}
                                      type="button"
                                      role="menuitemradio"
                                      aria-checked={tc.status === s}
                                      onClick={() => {
                                        onInlineStatusChange(tc.id, s);
                                        setInlineDropdownId(null);
                                        setInlineDropdownAnchor(null);
                                      }}
                                      className={cn(
                                        'hover:bg-bg-3 flex w-full items-center gap-2 px-3 py-1.5 text-[12px]',
                                        tc.status === s ? RESULT_META[s].text : 'text-white/80'
                                      )}
                                    >
                                      {RESULT_META[s].label}
                                      <kbd className="ml-auto font-mono text-[10px] text-white/30">
                                        {RESULT_META[s].shortcut}
                                      </kbd>
                                    </button>
                                  ))}
                                </div>,
                                document.body
                              )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })
        )}
      </div>
    </div>
  );
};
