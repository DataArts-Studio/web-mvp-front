'use client';

import React from 'react';

import { EmptyState, Pagination } from '@testea/ui';
import { AlertCircle, ListTodo, Search } from 'lucide-react';

import {
  type ITestRun,
  type RunSourceType,
  type RunStatusFilter,
  getStatusFilterLabel,
} from './runs-list-constants';
import { SuiteSourceName } from './suite-source-name';

interface RunsListTableProps {
  paginatedRuns: ITestRun[];
  sortedRunsCount: number;
  totalRunsCount: number;
  hasError: boolean;
  searchTerm: string;
  statusFilter: RunStatusFilter;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRunClick: (runId: string) => void;
  onDeleteClick: (run: ITestRun) => void;
  onRerunClick: (run: ITestRun) => void;
  rerunPendingId: string | null;
  onRefetch: () => void;
  onResetFilters: () => void;
  onCreateRun: () => void;
}

const getSourceLabel = (type: RunSourceType) => {
  switch (type) {
    case 'SUITE':
      return '스위트';
    case 'MILESTONE':
      return '마일스톤';
    default:
      return '단독 실행';
  }
};

const getStatusMeta = (status: ITestRun['status']) => {
  switch (status) {
    case 'COMPLETED':
      return {
        label: '완료됨',
        dotClass: 'bg-system-green',
        badgeClass: 'border-system-green/30 bg-system-green/10 text-system-green',
      };
    case 'IN_PROGRESS':
      return {
        label: '진행 중',
        dotClass: 'bg-amber-400',
        badgeClass: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
      };
    default:
      return {
        label: '시작 전',
        dotClass: 'bg-bg-4',
        badgeClass: 'border-line-2 bg-bg-3 text-text-3',
      };
  }
};

const RunProgressBar = ({ run }: { run: ITestRun }) => {
  const { totalCases } = run.stats;

  if (totalCases === 0) return <div className="rounded-1 bg-bg-4 h-1.5 w-full" />;

  const passP = (run.stats.pass / totalCases) * 100;
  const failP = (run.stats.fail / totalCases) * 100;
  const blockedP = (run.stats.blocked / totalCases) * 100;
  const untestedP = Math.max(0, 100 - passP - failP - blockedP);

  return (
    <div className="rounded-1 bg-bg-4 flex h-1.5 w-full overflow-hidden">
      {run.stats.pass > 0 && <div className="bg-system-green" style={{ width: `${passP}%` }} />}
      {run.stats.fail > 0 && <div className="bg-system-red" style={{ width: `${failP}%` }} />}
      {run.stats.blocked > 0 && <div className="bg-amber-400" style={{ width: `${blockedP}%` }} />}
      {untestedP > 0 && <div className="bg-bg-4" style={{ width: `${untestedP}%` }} />}
    </div>
  );
};

export const RunsListTable = ({
  paginatedRuns,
  sortedRunsCount,
  totalRunsCount,
  hasError,
  searchTerm,
  statusFilter,
  currentPage,
  totalPages,
  onPageChange,
  onRunClick,
  onDeleteClick,
  onRerunClick,
  rerunPendingId,
  onRefetch,
  onResetFilters,
  onCreateRun,
}: RunsListTableProps) => {
  if (hasError && totalRunsCount === 0) {
    return (
      <section className="col-span-6 flex min-h-0 flex-col">
        <EmptyState
          icon={<AlertCircle className="h-10 w-10" />}
          title="데이터를 불러오지 못했습니다."
          description="일시적인 오류가 발생했습니다."
          className="h-full min-h-[280px] px-6"
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
      </section>
    );
  }

  if (totalRunsCount === 0) {
    return (
      <section className="col-span-6 flex min-h-0 flex-col">
        <EmptyState
          icon={<ListTodo className="h-10 w-10" />}
          title="생성된 테스트 실행이 없습니다."
          description="새로운 테스트 실행을 생성하여 결과를 기록해보세요."
          className="h-full min-h-[280px] px-6"
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
      </section>
    );
  }

  if (sortedRunsCount === 0) {
    const description = searchTerm
      ? `"${searchTerm}"에 대한 결과가 없습니다.`
      : `상태: ${getStatusFilterLabel(statusFilter)}`;

    return (
      <section className="col-span-6 flex min-h-0 flex-col">
        <EmptyState
          icon={<Search className="h-10 w-10" />}
          title="검색 결과가 없습니다."
          description={description}
          className="h-full min-h-[280px] px-6"
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
      </section>
    );
  }

  return (
    <section className="col-span-6 flex min-h-0 flex-col overflow-hidden">
      {(searchTerm || statusFilter !== 'ALL') && (
        <div className="border-line-2 text-text-4 typo-caption-normal border-b py-2">
          {sortedRunsCount}개 결과
          {searchTerm && <span className="ml-1">/ &quot;{searchTerm}&quot;</span>}
          {statusFilter !== 'ALL' && (
            <span className="ml-1">/ {getStatusFilterLabel(statusFilter)}</span>
          )}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col">
          {paginatedRuns.map((run) => {
            const statusMeta = getStatusMeta(run.status);
            const { totalCases, completedCases, progressPercent } = run.stats;

            return (
              <article
                key={run.id}
                className="border-line-2 hover:bg-bg-2 grid grid-cols-1 gap-3 border-b px-1 py-4 transition-colors last:border-b-0 md:grid-cols-[minmax(0,1fr)_260px] md:items-start md:gap-6"
              >
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => onRunClick(run.id)}
                    className="typo-body2-heading text-text-1 hover:text-primary focus-visible:ring-primary/40 block max-w-full truncate text-left focus-visible:ring-2 focus-visible:outline-none"
                  >
                    {run.name}
                  </button>
                  <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="typo-caption-normal text-text-4">
                      {getSourceLabel(run.sourceType)}
                    </span>
                    <span className="text-text-4" aria-hidden="true">
                      /
                    </span>
                    <SuiteSourceName sourceName={run.sourceName} sourceType={run.sourceType} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <button
                      type="button"
                      onClick={() => onRerunClick(run)}
                      disabled={rerunPendingId === run.id}
                      className="typo-caption-normal text-text-3 hover:text-primary disabled:opacity-50"
                    >
                      {rerunPendingId === run.id ? '생성 중' : '다시 실행'}
                    </button>
                    <span className="text-text-4" aria-hidden="true">
                      /
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeleteClick(run)}
                      className="typo-caption-normal text-text-3 hover:text-system-red"
                    >
                      삭제
                    </button>
                  </div>
                </div>

                <div className="min-w-0 md:text-right">
                  <div className="flex min-w-0 items-center gap-2 md:justify-end">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${statusMeta.dotClass}`}
                      aria-hidden="true"
                    />
                    <span
                      className={`typo-caption-heading rounded-1 inline-flex max-w-full items-center border px-2 py-0.5 ${statusMeta.badgeClass}`}
                    >
                      {statusMeta.label}
                    </span>
                  </div>
                  <div className="mt-2 md:ml-auto md:max-w-[220px]">
                    <div className="typo-caption-normal text-text-4 mb-1 flex justify-between">
                      <span>{progressPercent}%</span>
                      <span>
                        {completedCases}/{totalCases}
                      </span>
                    </div>
                    <RunProgressBar run={run} />
                  </div>
                  <p className="typo-caption-normal text-text-4 mt-2">
                    {new Date(run.updatedAt).toLocaleDateString()}{' '}
                    {new Date(run.updatedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        className="border-line-2 border-t"
      />
    </section>
  );
};
