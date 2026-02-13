import React from 'react';

import { TestSuiteCard } from '@/entities/test-suite';
import { DSButton, cn } from '@/shared';
import { formatDate } from '@/shared/utils/date-format';
import {
  CheckCircle,
  Edit2,
  Flag,
  History,
  ListChecks,
  Play,
  Trash2,
  X,
  XCircle,
  AlertCircle,
} from 'lucide-react';

interface TestSuiteSideViewProps {
  suite: TestSuiteCard;
  onClose: () => void;
  onRun?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const TAG_TONE_STYLES: Record<string, string> = {
  neutral: 'bg-slate-500/20 text-slate-300',
  info: 'bg-blue-500/20 text-blue-300',
  success: 'bg-green-500/20 text-green-300',
  warning: 'bg-amber-500/20 text-amber-300',
  danger: 'bg-red-500/20 text-red-300',
};

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  passed: {
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'text-green-400',
  },
  failed: {
    icon: <XCircle className="h-4 w-4" />,
    color: 'text-red-400',
  },
  blocked: {
    icon: <AlertCircle className="h-4 w-4" />,
    color: 'text-amber-400',
  },
  running: {
    icon: <Play className="h-4 w-4" />,
    color: 'text-blue-400',
  },
  not_run: {
    icon: <ListChecks className="h-4 w-4" />,
    color: 'text-slate-400',
  },
};

export const TestSuiteSideView = ({
  suite,
  onClose,
  onRun,
  onEdit,
  onDelete,
}: TestSuiteSideViewProps) => {
  const tagStyle = TAG_TONE_STYLES[suite.tag.tone] || TAG_TONE_STYLES.neutral;

  return (
    <>
    {/* 배경 오버레이 - 클릭 시 사이드뷰 닫힘 */}
    <div
      className="fixed inset-0 z-40 bg-black/50"
      onClick={onClose}
      aria-hidden="true"
    />
    <section className="bg-bg-1 border-bg-4 fixed top-0 right-0 z-50 h-full w-[600px] translate-x-0 overflow-y-auto border-l p-4 transition-transform duration-300 ease-in-out">
      <div className="flex flex-col gap-6">
        {/* 헤더 */}
        <header className="flex flex-col gap-3">
          <div className="flex justify-between">
            <DSButton size="small" variant="ghost" className="px-2" onClick={onClose}>
              <X className="h-4 w-4" />
            </DSButton>
            <DSButton
              size="small"
              variant="ghost"
              className="flex items-center gap-1 px-2"
              onClick={onEdit}
            >
              <Edit2 className="h-4 w-4" />
              <span>수정</span>
            </DSButton>
          </div>

          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">{suite.title}</h2>
            <span className={cn('rounded-full px-3 py-1 text-sm font-medium', tagStyle)}>
              {suite.tag.label}
            </span>
          </div>

          {/* 연결된 마일스톤 */}
          {suite.linkedMilestone && (
            <div className="text-text-3 flex items-center gap-1.5 text-sm">
              <Flag className="h-4 w-4" strokeWidth={1.5} />
              <span>
                {suite.linkedMilestone.title} ({suite.linkedMilestone.versionLabel})
              </span>
            </div>
          )}
        </header>

        {/* 설명 */}
        <div className="flex flex-col gap-2">
          <h3 className="text-text-3 text-lg font-semibold">설명</h3>
          <div className="bg-bg-2 border-line-2 rounded-4 border p-4">
            <p className="text-text-2">{suite.description || '설명이 없습니다.'}</p>
          </div>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-bg-2 border-line-2 rounded-4 flex flex-col gap-1 border p-4">
            <div className="text-text-3 flex items-center gap-1.5 text-sm">
              <ListChecks className="h-4 w-4" strokeWidth={1.5} />
              <span>테스트 케이스</span>
            </div>
            <span className="text-text-1 text-xl font-bold">{suite.caseCount}개</span>
          </div>

          <div className="bg-bg-2 border-line-2 rounded-4 flex flex-col gap-1 border p-4">
            <div className="text-text-3 flex items-center gap-1.5 text-sm">
              <History className="h-4 w-4" strokeWidth={1.5} />
              <span>실행 이력</span>
            </div>
            <span className="text-text-1 text-xl font-bold">{suite.executionHistoryCount}회</span>
          </div>
        </div>

        {/* 마지막 실행 결과 */}
        {suite.lastRun && (
          <div className="flex flex-col gap-3">
            <h3 className="text-text-3 text-lg font-semibold">마지막 실행 결과</h3>
            <div className="bg-bg-2 border-line-2 rounded-4 border p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-text-3 text-sm">{formatDate(suite.lastRun.runAt)}</span>
                <span
                  className={cn(
                    'flex items-center gap-1',
                    STATUS_CONFIG[suite.lastRun.status]?.color
                  )}
                >
                  {STATUS_CONFIG[suite.lastRun.status]?.icon}
                  <span className="text-sm font-medium capitalize">{suite.lastRun.status}</span>
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-green-400">
                    {suite.lastRun.counts.passed}
                  </span>
                  <span className="text-text-3 text-xs">Passed</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-red-400">
                    {suite.lastRun.counts.failed}
                  </span>
                  <span className="text-text-3 text-xs">Failed</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-amber-400">
                    {suite.lastRun.counts.blocked}
                  </span>
                  <span className="text-text-3 text-xs">Blocked</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-slate-400">
                    {suite.lastRun.counts.skipped}
                  </span>
                  <span className="text-text-3 text-xs">Skipped</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 최근 실행 이력 미니 그래프 */}
        {suite.recentRuns.length > 0 && (
          <div className="flex flex-col gap-3">
            <h3 className="text-text-3 text-lg font-semibold">최근 실행 이력</h3>
            <div className="flex gap-1">
              {suite.recentRuns.slice(0, 5).map((run) => {
                const passRate = run.total > 0 ? (run.passed / run.total) * 100 : 0;
                return (
                  <div
                    key={run.runId}
                    className="bg-bg-2 border-line-2 flex-1 rounded border p-2 text-center"
                    title={`${formatDate(run.runAt)} - ${run.passed}/${run.total} passed`}
                  >
                    <div
                      className={cn(
                        'mx-auto mb-1 h-2 w-2 rounded-full',
                        run.status === 'passed'
                          ? 'bg-green-400'
                          : run.status === 'failed'
                            ? 'bg-red-400'
                            : 'bg-amber-400'
                      )}
                    />
                    <span className="text-text-3 text-xs">{Math.round(passRate)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="border-line-2 mt-auto flex gap-2 border-t pt-4">
          <DSButton className="flex flex-1 items-center justify-center gap-2" onClick={onRun}>
            <Play className="h-4 w-4" />
            테스트 실행
          </DSButton>
          <DSButton
            variant="ghost"
            className="flex items-center gap-2 text-red-400"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
            삭제
          </DSButton>
        </div>
      </div>
    </section>
    </>
  );
};
