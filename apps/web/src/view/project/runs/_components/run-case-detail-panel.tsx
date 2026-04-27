'use client';

import React from 'react';
import { type UseMutationResult } from '@tanstack/react-query';

import { DSButton, EmptyState } from '@testea/ui';
import { cn } from '@testea/util';
import { type TestCaseRunDetail } from '@/features/runs';

import {
  ChevronLeft,
  ChevronRight,
  ListTodo,
  Loader2,
} from 'lucide-react';

import { STATUS_CONFIG, type TestCaseRunStatus } from './run-detail-constants';

interface RunCaseDetailPanelProps {
  selectedCase: TestCaseRunDetail | null;
  filteredCases: TestCaseRunDetail[];
  selectedCaseId: string | null;
  setSelectedCaseId: (id: string) => void;
  comment: string;
  setComment: (comment: string) => void;
  handleStatusChange: (status: TestCaseRunStatus) => void;
  updateMutation: UseMutationResult<unknown, Error, { testCaseRunId: string; status: string; comment: string | null }>;
}

export const RunCaseDetailPanel = ({
  selectedCase,
  filteredCases,
  selectedCaseId,
  setSelectedCaseId,
  comment,
  setComment,
  handleStatusChange,
  updateMutation,
}: RunCaseDetailPanelProps) => {
  const currentIndex = filteredCases.findIndex((tc) => tc.id === selectedCaseId);

  return (
    <div className="flex w-[40%] min-w-0 flex-col overflow-hidden">
      {selectedCase ? (
        <>
          {/* Case Header — compact (fixed top) */}
          <div className="border-line-2 border-b px-5 py-3 shrink-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-primary font-mono text-xs font-medium">{selectedCase.code}</span>
              <span className={cn(
                'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium',
                STATUS_CONFIG[selectedCase.status].style,
                STATUS_CONFIG[selectedCase.status].bgStyle.split(' ')[0]
              )}>
                {STATUS_CONFIG[selectedCase.status].icon}
                {STATUS_CONFIG[selectedCase.status].label}
              </span>
              {selectedCase.executedAt && (
                <span className="text-text-4 text-[11px] ml-auto">
                  {new Date(selectedCase.executedAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
            <h2 className="text-text-1 text-base font-semibold break-all leading-snug">{selectedCase.title || '제목 없음'}</h2>
          </div>

          {/* Status Buttons — inline 4-button row (fixed) */}
          <div className="border-line-2 relative border-b px-5 py-3 shrink-0">
            {updateMutation.isPending && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-bg-1/70 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-primary">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-xs font-medium">저장 중...</span>
                </div>
              </div>
            )}
            <div className="flex gap-2">
              {(['pass', 'fail', 'blocked', 'untested'] as const).map((status) => {
                const config = STATUS_CONFIG[status];
                const isActive = selectedCase.status === status;

                return (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    disabled={updateMutation.isPending}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium transition-all',
                      isActive
                        ? cn(config.bgStyle, config.style, 'ring-1', status === 'pass' ? 'ring-green-500/40' : status === 'fail' ? 'ring-red-500/40' : status === 'blocked' ? 'ring-amber-500/40' : 'ring-slate-500/40')
                        : 'border-line-2 text-text-3 hover:bg-bg-2 hover:text-text-1',
                      updateMutation.isPending && 'opacity-50 cursor-not-allowed',
                    )}
                  >
                    {config.icon}
                    <span className="hidden sm:inline">{config.label}</span>
                    <kbd className="text-text-4 text-[10px] ml-0.5 hidden lg:inline">{config.shortcut}</kbd>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto min-h-0">
          {/* Test Case Details — compact */}
          <div className="border-line-2 flex flex-col gap-3 border-b px-5 py-3">
            {selectedCase.preCondition && (
              <DetailSection title="사전조건" content={selectedCase.preCondition} />
            )}
            {selectedCase.steps && (
              <DetailSection title="테스트 스텝" content={selectedCase.steps} />
            )}
            {selectedCase.expectedResult && (
              <DetailSection title="기대 결과" content={selectedCase.expectedResult} />
            )}
            {!selectedCase.preCondition && !selectedCase.steps && !selectedCase.expectedResult && (
              <p className="text-text-4 text-xs py-2">상세 정보가 등록되지 않았습니다.</p>
            )}
          </div>

          {/* Comment — compact */}
          <div className="px-5 py-3">
            <h3 className="text-text-3 mb-2 text-xs font-medium">코멘트</h3>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="테스트 결과에 대한 코멘트..."
              className="bg-bg-2 border-line-2 text-text-1 placeholder:text-text-4 focus:border-primary h-24 w-full resize-none rounded-lg border p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="mt-2 flex justify-end">
              <DSButton
                size="small"
                variant="ghost"
                onClick={() => {
                  if (selectedCase) {
                    updateMutation.mutate({
                      testCaseRunId: selectedCase.id,
                      status: selectedCase.status,
                      comment: comment || null,
                    });
                  }
                }}
                disabled={updateMutation.isPending || comment === (selectedCase?.comment || '')}
                className="text-xs"
              >
                {updateMutation.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                저장
              </DSButton>
            </div>
          </div>
          </div>{/* end scrollable area */}

          {/* Navigation Footer — fixed bottom */}
          <div className="border-line-2 flex items-center justify-between border-t px-5 py-2 shrink-0 bg-bg-1">
            <span className="text-text-4 text-xs tabular-nums">
              {currentIndex + 1} / {filteredCases.length}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => { if (currentIndex > 0) setSelectedCaseId(filteredCases[currentIndex - 1].id); }}
                disabled={currentIndex === 0}
                className="rounded-1 p-1 text-text-3 hover:bg-bg-2 hover:text-text-1 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="이전 케이스"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => { if (currentIndex < filteredCases.length - 1) setSelectedCaseId(filteredCases[currentIndex + 1].id); }}
                disabled={currentIndex === filteredCases.length - 1}
                className="rounded-1 p-1 text-text-3 hover:bg-bg-2 hover:text-text-1 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="다음 케이스"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          icon={<ListTodo className="h-10 w-10" />}
          title="테스트 케이스를 선택하세요"
          description="왼쪽 목록에서 케이스를 선택합니다."
          className="flex-1"
        />
      )}
    </div>
  );
};

// --- Detail section helper ---

const DetailSection = ({ title, content }: { title: string; content: string }) => (
  <div>
    <h3 className="text-text-3 mb-1 text-xs font-medium">{title}</h3>
    <div className="bg-bg-2 rounded-lg px-3 py-2">
      <p className="text-text-1 whitespace-pre-wrap break-words text-sm leading-relaxed">{content}</p>
    </div>
  </div>
);
