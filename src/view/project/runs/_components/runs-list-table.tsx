'use client';

import React from 'react';
import {
  Search,
  PlayCircle,
  Clock,
  CheckCircle2,
  ListTodo,
  Plus,
  AlertCircle,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { DSButton, RUN_STATUS_CONFIG, EmptyState, Pagination } from '@/shared/ui';
import { type ITestRun, type RunSourceType, type RunStatusFilter, getStatusFilterLabel } from './runs-list-constants';
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
  onRefetch: () => void;
  onResetFilters: () => void;
  onCreateRun: () => void;
}

const getSourceIcon = (type: RunSourceType) => {
  switch(type) {
    case 'SUITE': return <ListTodo className="h-3.5 w-3.5" />;
    case 'MILESTONE': return <Clock className="h-3.5 w-3.5" />;
    default: return <PlayCircle className="h-3.5 w-3.5" />;
  }
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
  onRefetch,
  onResetFilters,
  onCreateRun,
}: RunsListTableProps) => {
  return (
    <section className="col-span-6 flex min-h-0 flex-col overflow-hidden rounded-4 border border-line-2 bg-bg-2 shadow-1">
      {/* 검색 결과 요약 */}
      {(searchTerm || statusFilter !== 'ALL') && (
        <div className="flex items-center gap-2 border-b border-line-2 px-6 py-2 text-text-3">
          <span className="typo-body2-normal">
            {sortedRunsCount}개 결과
            {searchTerm && <span className="ml-1">· 검색어: &quot;{searchTerm}&quot;</span>}
            {statusFilter !== 'ALL' && <span className="ml-1">· 상태: {getStatusFilterLabel(statusFilter)}</span>}
          </span>
        </div>
      )}
      <div className="grid grid-cols-[5fr_3fr_2fr_2fr_auto] gap-4 border-b border-line-2 bg-bg-3 px-6 py-3">
        <div className="typo-caption-heading text-text-3 uppercase">실행 이름 / 기준</div>
        <div className="typo-caption-heading text-text-3 uppercase">진행률 (완료/전체)</div>
        <div className="text-center typo-caption-heading text-text-3 uppercase">상태</div>
        <div className="text-right typo-caption-heading text-text-3 uppercase">마지막 업데이트</div>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto">
        {paginatedRuns.map((run) => {
          const { totalCases, completedCases, progressPercent } = run.stats;

          return (
            <div
              key={run.id}
              onClick={() => onRunClick(run.id)}
              className="group grid cursor-pointer grid-cols-[5fr_3fr_2fr_2fr_auto] items-center gap-4 border-b border-line-2 px-6 py-5 transition-colors hover:bg-bg-3 last:border-b-0"
            >
              <div className="flex flex-col gap-1.5">
                <span className="typo-body1-heading text-text-1 group-hover:text-primary transition-colors">
                  {run.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-1 bg-bg-4 px-1.5 py-0.5 text-[11px] font-medium text-text-2">
                    {getSourceIcon(run.sourceType)}
                    {run.sourceType}
                  </span>
                  <SuiteSourceName sourceName={run.sourceName} sourceType={run.sourceType} />
                </div>
              </div>

              <div className="flex flex-col gap-2 pr-4">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-text-1">{progressPercent}%</span>
                  <span className="text-text-3">{completedCases} / {totalCases}</span>
                </div>
                {(() => {
                  const h = 8;
                  const r = h / 2;
                  if (totalCases === 0) return <div className="h-2 w-full rounded-full bg-bg-4" />;
                  const passP = (run.stats.pass / totalCases) * 100;
                  const failP = (run.stats.fail / totalCases) * 100;
                  const blockedP = (run.stats.blocked / totalCases) * 100;
                  const untestedP = 100 - passP - failP - blockedP;
                  return (
                    <svg width="100%" height={h} className="block overflow-hidden rounded-full">
                      <defs>
                        <clipPath id={`bar-clip-${run.id}`}>
                          <rect x="0" y="0" width="100%" height={h} rx={r} ry={r} />
                        </clipPath>
                      </defs>
                      <g clipPath={`url(#bar-clip-${run.id})`}>
                        {run.stats.pass > 0 && <rect x="0%" y="0" width={`${passP}%`} height={h} fill="#0BB57F" shapeRendering="crispEdges" />}
                        {run.stats.fail > 0 && <rect x={`${passP}%`} y="0" width={`${failP}%`} height={h} fill="#FC4141" shapeRendering="crispEdges" />}
                        {run.stats.blocked > 0 && <rect x={`${passP + failP}%`} y="0" width={`${blockedP}%`} height={h} fill="#FBA900" shapeRendering="crispEdges" />}
                        {untestedP > 0 && <rect x={`${passP + failP + blockedP}%`} y="0" width={`${untestedP}%`} height={h} fill="var(--color-bg-4)" shapeRendering="crispEdges" />}
                      </g>
                    </svg>
                  );
                })()}
              </div>

              <div className="flex justify-center">
                <span className={`typo-caption-heading inline-flex items-center rounded-1 px-2.5 py-1 ${RUN_STATUS_CONFIG[run.status]?.style ?? 'bg-bg-4 text-text-3'}`}>
                  {run.status === 'COMPLETED' && <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
                  {run.status === 'IN_PROGRESS' && <PlayCircle className="mr-1.5 h-3.5 w-3.5" />}
                  {RUN_STATUS_CONFIG[run.status]?.label ?? run.status}
                </span>
              </div>

              <div className="text-right">
                <span className="typo-caption-normal text-text-3">
                  {new Date(run.updatedAt).toLocaleDateString()}
                </span>
                <div className="typo-caption-normal text-text-4">
                  {new Date(run.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); onDeleteClick(run); }}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-2 text-text-4 opacity-0 transition-all hover:bg-system-red/10 hover:text-system-red group-hover:opacity-100"
                title="삭제"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}

        {/* 에러 발생 시 */}
        {hasError && totalRunsCount === 0 && (
          <EmptyState
            icon={<AlertCircle className="h-6 w-6" />}
            title="데이터를 불러오지 못했습니다."
            description="일시적인 오류가 발생했습니다. 다시 시도해주세요."
            action={
              <DSButton
                variant="ghost"
                className="mt-2 flex items-center gap-2"
                onClick={onRefetch}
              >
                <RefreshCw className="h-4 w-4" />
                다시 시도
              </DSButton>
            }
            className="h-60"
          />
        )}

        {/* 검색/필터 결과가 없을 때 */}
        {totalRunsCount > 0 && sortedRunsCount === 0 && (
          <EmptyState
            icon={<Search className="h-6 w-6" />}
            title="검색 결과가 없습니다."
            description={`${searchTerm ? `"${searchTerm}"에 대한 결과가 없습니다. ` : ''}${statusFilter !== 'ALL' ? `상태: ${getStatusFilterLabel(statusFilter)}` : ''}`}
            action={
              <button
                onClick={onResetFilters}
                className="mt-2 typo-body2-heading text-primary hover:underline"
              >
                필터 초기화
              </button>
            }
            className="h-60"
          />
        )}

        {/* 테스트 실행이 하나도 없을 때 */}
        {!hasError && totalRunsCount === 0 && (
          <EmptyState
            icon={<ListTodo className="h-6 w-6" />}
            title="생성된 테스트 실행이 없습니다."
            description="새로운 테스트 실행을 생성하여 결과를 기록해보세요."
            action={
              <DSButton
                variant="ghost"
                className="mt-2 flex items-center gap-2"
                onClick={onCreateRun}
              >
                <Plus className="h-4 w-4" />
                테스트 실행 생성
              </DSButton>
            }
            className="h-60"
          />
        )}
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} className="mt-auto border-t border-line-2" />
    </section>
  );
};
