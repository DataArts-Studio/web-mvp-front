'use client';

import React, { useEffect, useRef, useState } from 'react';

import Link from 'next/link';

import { type TestRunDetail } from '@/entities/test-run';
import { RUN_NAME_MAX_LENGTH } from '@/entities/test-run';
import { ShareButton } from '@/features/runs-share/ui/share-button';
import { useOutsideClick } from '@testea/lib';
import { cn, toAppDateOnly } from '@testea/util';
import { Check, ChevronLeft, MoreHorizontal, Pencil, X } from 'lucide-react';

interface RunDetailHeaderProps {
  testRun: TestRunDetail;
  projectSlug: string;
  testRunId: string;
  onRename: (name: string) => void;
  isRenaming: boolean;
  onShowShortcuts: () => void;
  showCharts: boolean;
  onToggleCharts: () => void;
  onRerun: () => void;
  isRerunning: boolean;
  onAutoRun: () => void;
  onAddTests: () => void;
  /** 끝난 실행을 고치는 중이면 결과 요약 화면으로 돌아가는 메뉴를 보인다. */
  onShowSummary?: () => void;
}

const STATUS_TEXT: Record<TestRunDetail['status'], { label: string; className: string }> = {
  NOT_STARTED: { label: '시작 전', className: 'text-white/50' },
  IN_PROGRESS: { label: '진행 중', className: 'text-result-running' },
  COMPLETED: { label: '완료', className: 'text-result-pass' },
};

const shortDate = (date: Date) => toAppDateOnly(new Date(date)).slice(5).replace('-', '.');

/** 실행 이름 옆 메타: 마일스톤, 스위트 수(또는 직접 고른 케이스), 만든 날. */
const metaOf = (testRun: TestRunDetail): string[] => {
  const milestone = testRun.sources.find((s) => s.type === 'milestone');
  const suites = testRun.sources.filter((s) => s.type === 'suite');
  const items: string[] = [];
  if (milestone) items.push(milestone.name);
  if (suites.length === 1) items.push(suites[0].name);
  else if (suites.length > 1) items.push(`스위트 ${suites.length}`);
  if (!milestone && suites.length === 0) items.push('직접 고른 케이스');
  items.push(`${shortDate(testRun.createdAt)} 생성`);
  return items;
};

export const RunDetailHeader = ({
  testRun,
  projectSlug,
  testRunId,
  onRename,
  isRenaming,
  onShowShortcuts,
  showCharts,
  onToggleCharts,
  onRerun,
  isRerunning,
  onAutoRun,
  onAddTests,
  onShowSummary,
}: RunDetailHeaderProps) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [showMore, setShowMore] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const moreMenuId = React.useId();

  useOutsideClick(moreRef, () => setShowMore(false), showMore);

  const prevIsRenaming = useRef(isRenaming);
  useEffect(() => {
    if (prevIsRenaming.current && !isRenaming) {
      setIsEditingTitle(false);
    }
    prevIsRenaming.current = isRenaming;
  }, [isRenaming]);

  const status = STATUS_TEXT[testRun.status] ?? STATUS_TEXT.NOT_STARTED;
  const suites = testRun.sources.filter((s) => s.type === 'suite');

  const menuItems: { label: string; onClick: () => void; disabled?: boolean }[] = [
    ...(onShowSummary ? [{ label: '결과 요약 보기', onClick: onShowSummary }] : []),
    { label: '테스트 추가', onClick: onAddTests },
    { label: '자동 실행', onClick: onAutoRun },
    {
      label: isRerunning ? '재실행 만드는 중' : '다시 실행',
      onClick: onRerun,
      disabled: isRerunning,
    },
    { label: showCharts ? '통계 차트 닫기' : '통계 차트 보기', onClick: onToggleCharts },
    { label: '키보드 단축키', onClick: onShowShortcuts },
  ];

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Link
        href={`/projects/${projectSlug}/runs`}
        className="shrink-0 text-white/50 transition-colors hover:text-white/90"
        aria-label="테스트 실행 목록으로 돌아가기"
      >
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
      </Link>

      {isEditingTitle ? (
        <form
          className="flex min-w-0 items-center gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            if (editTitle.trim() && editTitle.trim() !== testRun.name) {
              onRename(editTitle);
            } else {
              setIsEditingTitle(false);
            }
          }}
        >
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            maxLength={RUN_NAME_MAX_LENGTH}
            aria-label="실행 이름"
            className="bg-bg-2 border-line-2 focus:border-primary min-w-0 rounded-[6px] border px-2 py-0.5 text-[18px] font-bold text-white/95 outline-none"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Escape') setIsEditingTitle(false);
            }}
            disabled={isRenaming}
          />
          <button
            type="submit"
            className="text-primary hover:text-primary/80"
            disabled={isRenaming}
            aria-label="이름 저장"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setIsEditingTitle(false)}
            className="text-white/40 hover:text-white/80"
            disabled={isRenaming}
            aria-label="이름 변경 취소"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </form>
      ) : (
        <h1 className="min-w-0">
          <button
            type="button"
            className="group/title flex min-w-0 items-center gap-1.5 text-[20px] font-bold text-white/95"
            onClick={() => {
              setEditTitle(testRun.name);
              setIsEditingTitle(true);
            }}
            title={`${testRun.name} (눌러서 이름 바꾸기)`}
          >
            <span className="truncate">{testRun.name}</span>
            <Pencil
              className="h-3.5 w-3.5 shrink-0 text-white/30 opacity-0 transition-opacity group-hover/title:opacity-100"
              aria-hidden="true"
            />
          </button>
        </h1>
      )}

      <span className={cn('shrink-0 text-[13px] font-medium', status.className)}>
        {status.label}
      </span>

      <p
        className="hidden min-w-0 items-center gap-3 truncate text-[12px] text-white/38 md:flex"
        title={suites.length > 1 ? suites.map((s) => s.name).join(', ') : undefined}
      >
        {metaOf(testRun).map((item) => (
          <span key={item} className="truncate">
            {item}
          </span>
        ))}
      </p>

      <div className="flex-1" />

      <ShareButton
        testRunId={testRunId}
        shareToken={testRun.shareToken}
        shareExpiresAt={testRun.shareExpiresAt}
        variant="text"
      />

      <div className="relative shrink-0" ref={moreRef}>
        <button
          type="button"
          onClick={() => setShowMore((prev) => !prev)}
          aria-haspopup="menu"
          aria-expanded={showMore}
          aria-controls={showMore ? moreMenuId : undefined}
          aria-label="실행 메뉴 더 보기"
          className="flex h-[32px] w-[38px] items-center justify-center rounded-[6px] border border-white/[0.17] text-white/80 transition-colors hover:border-white/35"
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
        </button>
        {showMore && (
          <div
            id={moreMenuId}
            role="menu"
            className="border-line-2 bg-bg-2 shadow-2 absolute top-full right-0 z-30 mt-1 min-w-[160px] rounded-[6px] border py-1"
          >
            {menuItems.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  setShowMore(false);
                  item.onClick();
                }}
                className="hover:bg-bg-3 flex w-full px-3 py-2 text-left text-[13px] text-white/80 disabled:opacity-50"
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
