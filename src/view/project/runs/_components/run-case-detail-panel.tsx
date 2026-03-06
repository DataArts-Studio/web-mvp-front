'use client';

import React from 'react';
import { type UseMutationResult } from '@tanstack/react-query';

import { DSButton, EmptyState } from '@/shared/ui';
import { cn } from '@/shared/utils';
import { type TestCaseRunDetail } from '@/features/runs';

import {
  ChevronDown,
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
  showStatusDropdown: boolean;
  setShowStatusDropdown: (show: boolean) => void;
  statusDropdownRef: React.RefObject<HTMLDivElement | null>;
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
  showStatusDropdown,
  setShowStatusDropdown,
  statusDropdownRef,
}: RunCaseDetailPanelProps) => {
  return (
    <div className="flex w-[40%] min-w-0 flex-col overflow-y-auto overflow-x-hidden">
      {selectedCase ? (
        <>
          {/* Case Header */}
          <div className="border-line-2 overflow-hidden border-b p-6">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">{selectedCase.code}</span>
              <span className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                STATUS_CONFIG[selectedCase.status].style,
                STATUS_CONFIG[selectedCase.status].bgStyle.split(' ')[0]
              )}>
                {STATUS_CONFIG[selectedCase.status].icon}
                {STATUS_CONFIG[selectedCase.status].label}
              </span>
            </div>
            <h2 className="text-text-1 text-xl font-semibold break-all">{selectedCase.title || '제목 없음'}</h2>
          </div>

          {/* Status Dropdown */}
          <div className="border-line-2 relative border-b p-6">
            {updateMutation.isPending && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-bg-1/70 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-primary">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm font-medium">저장 중...</span>
                </div>
              </div>
            )}
            <h3 className="text-text-2 mb-3 text-sm font-medium">결과 기록</h3>
            <div className="relative" ref={statusDropdownRef}>
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                disabled={updateMutation.isPending}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg border-2 px-4 py-3 transition-all',
                  STATUS_CONFIG[selectedCase.status].bgStyle,
                  STATUS_CONFIG[selectedCase.status].style
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{STATUS_CONFIG[selectedCase.status].icon}</span>
                  <span className="font-medium">{STATUS_CONFIG[selectedCase.status].label}</span>
                </div>
                <ChevronDown className={cn('h-5 w-5 transition-transform', showStatusDropdown && 'rotate-180')} />
              </button>

              {showStatusDropdown && (
                <div className="bg-bg-2 border-line-2 absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border shadow-xl">
                  {(['pass', 'fail', 'blocked', 'untested'] as const).map((status) => {
                    const config = STATUS_CONFIG[status];
                    const isActive = selectedCase.status === status;

                    return (
                      <button
                        key={status}
                        onClick={() => {
                          handleStatusChange(status);
                          setShowStatusDropdown(false);
                        }}
                        className={cn(
                          'flex w-full items-center gap-3 px-4 py-3 transition-colors',
                          isActive ? cn(config.bgStyle, config.style) : 'hover:bg-bg-3'
                        )}
                      >
                        <span className={cn('text-lg', isActive ? config.style : 'text-text-3')}>
                          {config.icon}
                        </span>
                        <span className={cn('flex-1 text-left font-medium', isActive ? config.style : 'text-text-1')}>
                          {config.label}
                        </span>
                        <kbd className="bg-bg-3 text-text-4 rounded px-1.5 py-0.5 text-xs">
                          {config.shortcut}
                        </kbd>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Test Case Details */}
          <div className="border-line-2 flex flex-col gap-4 border-b p-6">
            {selectedCase.preCondition && (
              <div>
                <h3 className="text-text-2 mb-2 text-sm font-medium">사전조건</h3>
                <div className="bg-bg-2 rounded-lg p-3">
                  <p className="text-text-1 whitespace-pre-wrap break-words text-sm">{selectedCase.preCondition}</p>
                </div>
              </div>
            )}
            {selectedCase.steps && (
              <div>
                <h3 className="text-text-2 mb-2 text-sm font-medium">테스트 스텝</h3>
                <div className="bg-bg-2 rounded-lg p-3">
                  <p className="text-text-1 whitespace-pre-wrap break-words text-sm">{selectedCase.steps}</p>
                </div>
              </div>
            )}
            {selectedCase.expectedResult && (
              <div>
                <h3 className="text-text-2 mb-2 text-sm font-medium">기대 결과</h3>
                <div className="bg-bg-2 rounded-lg p-3">
                  <p className="text-text-1 whitespace-pre-wrap break-words text-sm">{selectedCase.expectedResult}</p>
                </div>
              </div>
            )}
            {!selectedCase.preCondition && !selectedCase.steps && !selectedCase.expectedResult && (
              <p className="text-text-3 text-sm">사전조건, 테스트 스텝, 기대 결과가 등록되지 않았습니다.</p>
            )}
          </div>

          {/* Comment Section */}
          <div className="flex-1 p-6">
            <h3 className="text-text-2 mb-3 text-sm font-medium">코멘트</h3>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="테스트 결과에 대한 코멘트를 입력하세요..."
              className="bg-bg-2 border-line-2 text-text-1 placeholder:text-text-4 focus:border-primary h-32 w-full resize-none rounded-lg border p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="mt-3 flex justify-end">
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
                className="flex items-center gap-2"
              >
                {updateMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                코멘트 저장
              </DSButton>
            </div>
          </div>

          {/* Navigation Footer */}
          <div className="border-line-2 flex items-center justify-between border-t p-4">
            <div className="text-text-3 text-sm">
              {filteredCases.findIndex((tc) => tc.id === selectedCaseId) + 1} / {filteredCases.length}
            </div>
            <div className="flex gap-2">
              <DSButton
                size="small"
                variant="ghost"
                onClick={() => {
                  const idx = filteredCases.findIndex((tc) => tc.id === selectedCaseId);
                  if (idx > 0) setSelectedCaseId(filteredCases[idx - 1].id);
                }}
                disabled={filteredCases.findIndex((tc) => tc.id === selectedCaseId) === 0}
              >
                이전
              </DSButton>
              <DSButton
                size="small"
                variant="ghost"
                onClick={() => {
                  const idx = filteredCases.findIndex((tc) => tc.id === selectedCaseId);
                  if (idx < filteredCases.length - 1) setSelectedCaseId(filteredCases[idx + 1].id);
                }}
                disabled={filteredCases.findIndex((tc) => tc.id === selectedCaseId) === filteredCases.length - 1}
              >
                다음
              </DSButton>
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          icon={<ListTodo className="h-12 w-12" />}
          title="테스트 케이스를 선택하세요"
          description="왼쪽 목록에서 테스트할 케이스를 선택합니다."
          className="flex-1"
        />
      )}
    </div>
  );
};
