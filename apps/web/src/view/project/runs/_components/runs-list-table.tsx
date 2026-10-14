'use client';

import React from 'react';

import { DsCheckbox, EmptyState } from '@testea/ui';
import { cn } from '@testea/util';
import { AlertCircle, ListTodo, Search } from 'lucide-react';

import type { ITestRun } from './runs-list-constants';
import {
  comparisonLabelOf,
  groupRuns,
  isRunOpen,
  milestoneOverdueDays,
  passRateOf,
  timeLabelOf,
} from './runs-list-model';

interface RunsListTableProps {
  runs: ITestRun[];
  /** 직전 회차 비교에 쓰는 전체 실행 목록(필터 전). */
  allRuns: ITestRun[];
  totalRunsCount: number;
  hasError: boolean;
  isFiltered: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (runId: string) => void;
  onToggleSelectAll: () => void;
  onClearSelection: () => void;
  onDeleteSelected: () => void;
  onRunClick: (runId: string) => void;
  onRerunClick: (run: ITestRun) => void;
  rerunPendingId: string | null;
  onRefetch: () => void;
  onResetFilters: () => void;
  onCreateRun: () => void;
}

/** 칸 너비. 머리글과 행이 같은 값을 쓴다. */
const ROW_GRID =
  'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-2 md:grid-cols-[minmax(0,1fr)_230px_130px_80px]';

const SOURCE_LABEL: Record<ITestRun['sourceType'], string> = {
  SUITE: '스위트',
  MILESTONE: '마일스톤',
  ADHOC: '',
};

/** 행 배경 막대. 진행 중은 진행한 만큼 파랑, 끝난 실행은 결과 비율대로 통과·실패·차단. */
const RowBar = ({ run }: { run: ITestRun }) => {
  const { totalCases, completedCases, pass, fail, blocked } = run.stats;
  if (totalCases === 0) return null;
  const pct = (n: number) => `${(n / totalCases) * 100}%`;

  if (isRunOpen(run)) {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex">
        <div className="bg-result-running/10" style={{ width: pct(completedCases) }} />
      </div>
    );
  }
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex">
      <div className="bg-result-pass/[0.08]" style={{ width: pct(pass) }} />
      <div className="bg-result-fail/[0.09]" style={{ width: pct(fail) }} />
      <div className="bg-result-blocked/[0.09]" style={{ width: pct(blocked) }} />
    </div>
  );
};

const Count = ({ label, value, tone }: { label: string; value: number; tone: string }) => (
  <span className="flex items-center gap-1">
    <span className="text-white/50">{label}</span>
    <span className={cn('font-bold', value > 0 ? tone : 'text-white/30')}>{value}</span>
  </span>
);

const CHECKBOX_CLASS =
  'border-white/40 bg-transparent rounded-[3px] focus:ring-offset-0 data-[state=checked]:border-primary';

interface RunRowProps {
  run: ITestRun;
  allRuns: ITestRun[];
  now: Date;
  selected: boolean;
  selecting: boolean;
  onToggleSelect: (runId: string) => void;
  onRunClick: (runId: string) => void;
  onRerunClick: (run: ITestRun) => void;
  rerunPending: boolean;
}

const RunRow = ({
  run,
  allRuns,
  now,
  selected,
  selecting,
  onToggleSelect,
  onRunClick,
  onRerunClick,
  rerunPending,
}: RunRowProps) => {
  const open = isRunOpen(run);
  const { pass, fail, blocked, completedCases, totalCases } = run.stats;
  const rate = passRateOf(run.stats);
  const comparison = open ? null : comparisonLabelOf(run, allRuns);
  const overdue = milestoneOverdueDays(run, now);
  const source = SOURCE_LABEL[run.sourceType];

  return (
    <li
      className={cn(
        'group border-line-2 relative border-b py-[11px] pr-3 pl-9 transition-colors',
        selected ? 'bg-primary/[0.06]' : 'hover:bg-white/[0.03]'
      )}
    >
      <RowBar run={run} />

      <span
        className={cn(
          'absolute top-1/2 left-3 z-10 flex -translate-y-1/2 transition-opacity',
          selecting || selected
            ? 'opacity-100'
            : 'opacity-0 group-focus-within:opacity-100 group-hover:opacity-100'
        )}
      >
        <DsCheckbox
          checked={selected}
          onCheckedChange={() => onToggleSelect(run.id)}
          aria-label={`${run.name} 선택`}
          className={CHECKBOX_CLASS}
        />
      </span>

      <div className={cn('relative', ROW_GRID)}>
        <div className="flex min-w-0 flex-col gap-1">
          <button
            type="button"
            onClick={() => onRunClick(run.id)}
            className="focus-visible:ring-primary/50 truncate text-left text-[14px] font-medium text-white/92 after:absolute after:inset-0 after:content-[''] hover:text-white focus-visible:outline-none focus-visible:after:ring-2"
          >
            {run.name}
          </button>
          <p className="flex min-w-0 items-center gap-3 text-[11px] text-white/38">
            <span className="truncate">
              {source ? `${source} ${run.sourceName}` : run.sourceName}
            </span>
            {overdue > 0 && (
              <span className="text-result-blocked shrink-0 font-medium">
                마일스톤 {overdue}일 지남
              </span>
            )}
          </p>
        </div>

        <p className="col-span-2 flex flex-wrap items-center gap-3 text-[12px] whitespace-nowrap md:col-span-1">
          <Count label="통과" value={pass} tone="text-result-pass" />
          <Count label="실패" value={fail} tone="text-result-fail" />
          <Count label="차단" value={blocked} tone="text-result-blocked" />
        </p>

        <div className="relative z-10 row-start-1 flex items-center justify-end gap-2 whitespace-nowrap md:col-start-3">
          <button
            type="button"
            onClick={() => onRerunClick(run)}
            disabled={rerunPending}
            className="hidden text-[12px] text-white/70 group-focus-within:inline group-hover:inline hover:text-white disabled:opacity-50"
          >
            {rerunPending ? '생성 중' : '재실행'}
          </button>
          {open ? (
            <p className="text-[15px]">
              <span className="text-result-running font-bold">{completedCases}</span>
              <span className="text-white/40"> /{totalCases}</span>
            </p>
          ) : (
            <>
              {comparison && (
                <span className="text-[11px] text-white/40 group-focus-within:hidden group-hover:hidden">
                  {comparison}
                </span>
              )}
              <span className="text-[16px] font-bold text-white/95">
                {rate === null ? '-' : `${rate}%`}
              </span>
            </>
          )}
        </div>

        <div className="hidden justify-end md:flex">
          <span className="text-[12px] whitespace-nowrap text-white/45 group-focus-within:hidden group-hover:hidden">
            {timeLabelOf(run, now)}
          </span>
          <span
            aria-hidden="true"
            className="text-primary hidden text-[12px] font-medium whitespace-nowrap group-focus-within:inline group-hover:inline"
          >
            {open ? '이어서 하기' : '결과 보기'} →
          </span>
        </div>
      </div>
    </li>
  );
};

export const RunsListTable = ({
  runs,
  allRuns,
  totalRunsCount,
  hasError,
  isFiltered,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onClearSelection,
  onDeleteSelected,
  onRunClick,
  onRerunClick,
  rerunPendingId,
  onRefetch,
  onResetFilters,
  onCreateRun,
}: RunsListTableProps) => {
  const now = React.useMemo(() => new Date(), []);
  const groups = React.useMemo(() => groupRuns(runs, now), [runs, now]);

  if (hasError && totalRunsCount === 0) {
    return (
      <EmptyState
        icon={<AlertCircle className="h-10 w-10" />}
        title="데이터를 불러오지 못했습니다."
        description="일시적인 오류가 발생했습니다."
        className="min-h-[280px] px-6"
        action={
          <button
            type="button"
            onClick={onRefetch}
            className="typo-body2-heading text-primary hover:underline"
          >
            다시 시도
          </button>
        }
      />
    );
  }

  if (totalRunsCount === 0) {
    return (
      <EmptyState
        icon={<ListTodo className="h-10 w-10" />}
        title="생성된 테스트 실행이 없습니다."
        description="새로운 테스트 실행을 생성하여 결과를 기록해보세요."
        className="min-h-[280px] px-6"
        action={
          <button
            type="button"
            onClick={onCreateRun}
            className="typo-body2-heading text-primary hover:underline"
          >
            테스트 실행 생성
          </button>
        }
      />
    );
  }

  if (runs.length === 0) {
    return (
      <EmptyState
        icon={<Search className="h-10 w-10" />}
        title="조건에 맞는 실행이 없습니다."
        description={isFiltered ? '검색어나 필터를 바꿔 보세요.' : undefined}
        className="min-h-[280px] px-6"
        action={
          <button
            type="button"
            onClick={onResetFilters}
            className="typo-body2-heading text-primary hover:underline"
          >
            필터 초기화
          </button>
        }
      />
    );
  }

  const selectedCount = runs.filter((run) => selectedIds.has(run.id)).length;
  const selecting = selectedCount > 0;
  const allChecked = selectedCount === runs.length;

  return (
    <div>
      {selecting ? (
        <div
          role="toolbar"
          aria-label="선택한 실행 일괄 처리"
          className="bg-primary/[0.06] flex items-center gap-2 py-2 pr-3 pl-3"
        >
          <DsCheckbox
            checked={allChecked}
            onCheckedChange={onToggleSelectAll}
            aria-label={allChecked ? '전체 선택 해제' : '보이는 실행 전체 선택'}
            className={CHECKBOX_CLASS}
          />
          <span className="ml-3 text-[13px] font-bold text-white/90">{selectedCount}건 선택</span>
          <button
            type="button"
            onClick={onDeleteSelected}
            className="ml-2 rounded-[5px] border border-white/20 px-2.5 py-1 text-[12px] font-medium text-white/85 hover:border-white/40"
          >
            휴지통으로
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClearSelection}
            className="text-[12px] text-white/50 hover:text-white/80"
          >
            선택 해제
          </button>
        </div>
      ) : (
        <div
          aria-hidden="true"
          className={cn(
            'hidden pt-2 pr-3 pb-1.5 pl-9 text-[11px] font-medium text-white/40 md:grid',
            ROW_GRID
          )}
        >
          <span>실행</span>
          <span>결과</span>
          <span className="text-right">통과율</span>
          <span className="text-right">시간</span>
        </div>
      )}

      {groups.map((group) => (
        <section key={group.key} aria-labelledby={`run-group-${group.key}`}>
          <h3
            id={`run-group-${group.key}`}
            className="flex items-center gap-2 pt-3 pr-3 pb-1.5 pl-9 text-[12px] font-medium text-white/45"
          >
            {group.label}
            {group.key === 'open' && <span className="text-white/30">{group.runs.length}</span>}
          </h3>
          <ul>
            {group.runs.map((run) => (
              <RunRow
                key={run.id}
                run={run}
                allRuns={allRuns}
                now={now}
                selected={selectedIds.has(run.id)}
                selecting={selecting}
                onToggleSelect={onToggleSelect}
                onRunClick={onRunClick}
                onRerunClick={onRerunClick}
                rerunPending={rerunPendingId === run.id}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
};
