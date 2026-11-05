'use client';

import React from 'react';

import { type TestCaseRunDetail } from '@/features/runs';
import { type UseMutationResult } from '@tanstack/react-query';
import { EmptyState } from '@testea/ui';
import { APP_TIME_ZONE, cn } from '@testea/util';
import { ChevronLeft, ChevronRight, ListTodo, Loader2 } from 'lucide-react';

import { RESULT_META, RESULT_ORDER, type TestCaseRunStatus } from './run-detail-constants';

interface RunCaseDetailPanelProps {
  selectedCase: TestCaseRunDetail | null;
  filteredCases: TestCaseRunDetail[];
  selectedCaseId: string | null;
  setSelectedCaseId: (id: string) => void;
  comment: string;
  setComment: (comment: string) => void;
  handleStatusChange: (status: TestCaseRunStatus) => void;
  updateMutation: UseMutationResult<
    unknown,
    Error,
    { testCaseRunId: string; status: string; comment: string | null }
  >;
}

const COMMENT_LABEL: Record<TestCaseRunStatus, string> = {
  fail: '실패 사유',
  blocked: '차단 사유',
  pass: '메모',
  untested: '메모',
};

const COMMENT_PLACEHOLDER: Record<TestCaseRunStatus, string> = {
  fail: '어느 단계에서 무엇이 기대와 달랐는지 적어 주세요',
  blocked: '진행하지 못한 이유를 적어 주세요',
  pass: '남길 내용이 있으면 적어 주세요',
  untested: '남길 내용이 있으면 적어 주세요',
};

/** 현재 케이스 다음의 미실행 케이스. 뒤에 없으면 앞에서부터 찾는다. */
const findNextUntested = (cases: TestCaseRunDetail[], currentIndex: number) =>
  cases.find((tc, i) => i > currentIndex && tc.status === 'untested') ??
  cases.find((tc, i) => i < currentIndex && tc.status === 'untested') ??
  null;

const DetailSection = ({ title, content }: { title: string; content: string }) => (
  <section className="mt-[18px]">
    <h3 className="text-[12px] font-medium text-white/45">{title}</h3>
    <p className="mt-1.5 text-[13px] leading-relaxed break-words whitespace-pre-wrap text-white/90">
      {content}
    </p>
  </section>
);

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
  const nextUntested = findNextUntested(filteredCases, currentIndex);

  if (!selectedCase) {
    return (
      <div className="hidden min-w-0 flex-1 flex-col lg:flex">
        <EmptyState
          icon={<ListTodo className="h-10 w-10" />}
          title="테스트 케이스를 선택하세요"
          description="왼쪽 목록에서 케이스를 선택합니다."
          className="flex-1"
        />
      </div>
    );
  }

  const commentChanged = comment !== (selectedCase.comment || '');
  const saveComment = () => {
    if (!commentChanged || updateMutation.isPending) return;
    updateMutation.mutate({
      testCaseRunId: selectedCase.id,
      status: selectedCase.status,
      comment: comment || null,
    });
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-[18px] pb-4 md:px-7">
        <p className="flex min-w-0 items-center gap-2 text-[12px]">
          <span className="shrink-0 font-mono font-medium text-white/60">{selectedCase.code}</span>
          {selectedCase.testSuiteName && (
            <span className="truncate text-white/40">{selectedCase.testSuiteName}</span>
          )}
          {selectedCase.executedAt && (
            <span className="ml-auto shrink-0 text-[11px] text-white/35">
              {new Date(selectedCase.executedAt).toLocaleString('ko-KR', {
                timeZone: APP_TIME_ZONE,
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              기록
            </span>
          )}
        </p>
        <h2 className="mt-1.5 text-[18px] leading-snug font-bold break-all text-white/95">
          {selectedCase.title || '제목 없음'}
        </h2>

        <div className="relative mt-4" role="group" aria-label="결과 기록">
          {updateMutation.isPending && (
            <span className="text-primary absolute -top-5 right-0 flex items-center gap-1 text-[11px]">
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
              저장 중
            </span>
          )}
          <div className="flex gap-2">
            {RESULT_ORDER.map((status) => {
              const meta = RESULT_META[status];
              const isActive = selectedCase.status === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => handleStatusChange(status)}
                  disabled={updateMutation.isPending}
                  aria-pressed={isActive}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-2 rounded-[6px] border py-[9px] text-[13px] transition-colors disabled:cursor-not-allowed',
                    isActive
                      ? meta.active
                      : 'border-white/15 font-medium text-white/80 hover:border-white/30 hover:bg-white/[0.03]'
                  )}
                >
                  {meta.label}
                  <kbd className="hidden font-mono text-[10px] text-white/30 lg:inline">
                    {meta.shortcut}
                  </kbd>
                </button>
              );
            })}
          </div>
        </div>

        {selectedCase.preCondition && (
          <DetailSection title="사전 조건" content={selectedCase.preCondition} />
        )}
        {selectedCase.steps && <DetailSection title="테스트 스텝" content={selectedCase.steps} />}
        {selectedCase.expectedResult && (
          <DetailSection title="기대 결과" content={selectedCase.expectedResult} />
        )}
        {!selectedCase.preCondition && !selectedCase.steps && !selectedCase.expectedResult && (
          <p className="mt-[18px] text-[12px] text-white/35">
            사전 조건, 스텝, 기대 결과가 등록되지 않은 케이스입니다.
          </p>
        )}

        <section className="mt-[18px]">
          <label htmlFor="run-case-comment" className="text-[12px] font-medium text-white/45">
            {COMMENT_LABEL[selectedCase.status]}
          </label>
          <div
            className={cn(
              'mt-1.5 rounded-[8px] border px-3.5 pt-3 pb-2.5 transition-colors',
              commentChanged ? 'border-primary/60' : 'border-line-2 focus-within:border-primary/60'
            )}
          >
            <textarea
              id="run-case-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  saveComment();
                }
              }}
              placeholder={COMMENT_PLACEHOLDER[selectedCase.status]}
              rows={2}
              className="w-full resize-y bg-transparent text-[13px] text-white/90 outline-none placeholder:text-white/30"
            />
            <div className="mt-2 flex items-center">
              <span className="text-[11px] text-white/30">Ctrl + Enter 저장</span>
              <div className="flex-1" />
              <button
                type="button"
                onClick={saveComment}
                disabled={!commentChanged || updateMutation.isPending}
                className="text-primary text-[12px] font-medium disabled:text-white/25"
              >
                저장
              </button>
            </div>
          </div>
        </section>
      </div>

      <nav
        aria-label="케이스 이동"
        className="border-line-2 mx-4 flex shrink-0 items-center gap-3 border-t py-2.5 md:mx-7"
      >
        <button
          type="button"
          onClick={() => {
            if (currentIndex > 0) setSelectedCaseId(filteredCases[currentIndex - 1].id);
          }}
          disabled={currentIndex <= 0}
          className="p-1 text-white/50 hover:text-white/90 disabled:opacity-30"
          aria-label="이전 케이스"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <span className="font-mono text-[12px] text-white/60 tabular-nums">
          {currentIndex + 1} / {filteredCases.length}
        </span>
        <button
          type="button"
          onClick={() => {
            if (currentIndex < filteredCases.length - 1)
              setSelectedCaseId(filteredCases[currentIndex + 1].id);
          }}
          disabled={currentIndex === filteredCases.length - 1}
          className="p-1 text-white/50 hover:text-white/90 disabled:opacity-30"
          aria-label="다음 케이스"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
        <div className="flex-1" />
        <span className="hidden text-[11px] text-white/30 lg:inline">J / K 이동</span>
        {nextUntested && (
          <button
            type="button"
            onClick={() => setSelectedCaseId(nextUntested.id)}
            className="text-primary text-[12px] font-medium whitespace-nowrap hover:underline"
          >
            다음 미실행 케이스 →
          </button>
        )}
      </nav>
    </div>
  );
};
