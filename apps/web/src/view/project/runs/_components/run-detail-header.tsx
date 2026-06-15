'use client';

import React, { useEffect, useRef, useState } from 'react';

import Link from 'next/link';

import { type TestRunDetail } from '@/entities/test-run';
import { type SourceInfo } from '@/entities/test-run';
import { ShareButton } from '@/features/runs-share/ui/share-button';
import { useOutsideClick } from '@testea/lib';
import { RUN_STATUS_CONFIG } from '@testea/ui';
import { cn } from '@testea/util';
import { formatDateKR } from '@testea/util';
import {
  ArrowLeft,
  BarChart3,
  Check,
  ChevronDown,
  Keyboard,
  Pencil,
  RotateCcw,
  X,
  Zap,
} from 'lucide-react';

import { SOURCE_TYPE_CONFIG } from './run-detail-constants';

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
}

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
}: RunDetailHeaderProps) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const sourceDropdownRef = useRef<HTMLDivElement>(null);

  useOutsideClick(sourceDropdownRef, () => setShowSourceDropdown(false), showSourceDropdown);

  const prevIsRenaming = useRef(isRenaming);
  useEffect(() => {
    if (prevIsRenaming.current && !isRenaming) {
      setIsEditingTitle(false);
    }
    prevIsRenaming.current = isRenaming;
  }, [isRenaming]);

  const statusInfo = RUN_STATUS_CONFIG[testRun.status] || RUN_STATUS_CONFIG.NOT_STARTED;
  const sourceInfo = SOURCE_TYPE_CONFIG[testRun.sourceType] || SOURCE_TYPE_CONFIG.ADHOC;

  return (
    <header className="border-line-2 bg-bg-1 border-b px-6 py-3">
      <div className="flex items-center gap-3">
        {/* Back */}
        <Link
          href={`/projects/${projectSlug}/runs`}
          className="text-text-3 hover:text-text-1 shrink-0 transition-colors"
          aria-label="테스트 실행 목록으로 돌아가기"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        {/* Title + Meta */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {isEditingTitle ? (
              <form
                className="flex items-center gap-1.5"
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
                  className="bg-bg-2 border-line-2 rounded-1 text-text-1 focus:border-primary focus:ring-primary border px-2 py-0.5 text-base font-semibold focus:ring-1 focus:outline-none"
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
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingTitle(false)}
                  className="text-text-3 hover:text-text-1"
                  disabled={isRenaming}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </form>
            ) : (
              <button
                className="group/title hover:text-primary flex min-w-0 items-center gap-1.5 text-base font-semibold transition-colors"
                onClick={() => {
                  setEditTitle(testRun.name);
                  setIsEditingTitle(true);
                }}
                title={testRun.name}
              >
                <span className="truncate">{testRun.name}</span>
                <Pencil className="text-text-4 h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover/title:opacity-100" />
              </button>
            )}
            <span
              className={cn(
                'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium',
                statusInfo.style
              )}
            >
              {statusInfo.label}
            </span>
          </div>

          {/* Meta row */}
          <div className="mt-0.5 flex items-center gap-3">
            <SourceInfoCompact
              sourceInfo={sourceInfo}
              sources={testRun.sources}
              sourceName={testRun.sourceName}
              showSourceDropdown={showSourceDropdown}
              setShowSourceDropdown={setShowSourceDropdown}
              sourceDropdownRef={sourceDropdownRef}
            />
            <span className="text-text-4 text-[10px]">·</span>
            <span className="text-text-4 text-xs">{formatDateKR(testRun.createdAt)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={onAutoRun}
            className="rounded-1 text-text-3 hover:text-text-1 hover:bg-bg-2 p-1.5 transition-colors"
            aria-label="자동 실행"
            title="자동 실행"
          >
            <Zap className="h-4 w-4" />
          </button>
          <button
            onClick={onRerun}
            disabled={isRerunning}
            className="rounded-1 text-text-3 hover:text-text-1 hover:bg-bg-2 p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="다시 실행"
            title="다시 실행"
          >
            <RotateCcw className={cn('h-4 w-4', isRerunning && 'animate-spin')} />
          </button>
          <button
            onClick={onToggleCharts}
            className={cn(
              'rounded-1 text-text-3 hover:text-text-1 hover:bg-bg-2 p-1.5 transition-colors',
              showCharts && 'text-primary bg-primary/10 hover:text-primary'
            )}
            aria-label="통계 차트 토글"
            title="통계 차트"
          >
            <BarChart3 className="h-4 w-4" />
          </button>
          <button
            onClick={onShowShortcuts}
            className="rounded-1 text-text-3 hover:text-text-1 hover:bg-bg-2 p-1.5 transition-colors"
            aria-label="키보드 단축키 보기"
            title="키보드 단축키"
          >
            <Keyboard className="h-4 w-4" />
          </button>
          <ShareButton
            testRunId={testRunId}
            shareToken={testRun.shareToken}
            shareExpiresAt={testRun.shareExpiresAt}
          />
        </div>
      </div>
    </header>
  );
};

// --- Compact source info ---

interface SourceInfoCompactProps {
  sourceInfo: { label: string; icon: React.ReactNode };
  sources: SourceInfo[];
  sourceName: string;
  showSourceDropdown: boolean;
  setShowSourceDropdown: (show: boolean) => void;
  sourceDropdownRef: React.RefObject<HTMLDivElement | null>;
}

const SourceInfoCompact = ({
  sourceInfo,
  sources,
  sourceName,
  showSourceDropdown,
  setShowSourceDropdown,
  sourceDropdownRef,
}: SourceInfoCompactProps) => {
  const suites = sources.filter((s) => s.type === 'suite');
  const milestoneSource = sources.find((s) => s.type === 'milestone');
  const MAX_VISIBLE = 2;

  return (
    <div className="text-text-3 flex items-center gap-1.5 text-xs" ref={sourceDropdownRef}>
      <span className="shrink-0 [&_svg]:h-3 [&_svg]:w-3">{sourceInfo.icon}</span>
      {suites.length === 0 ? (
        <span className="truncate">{sourceName}</span>
      ) : (
        <span className="relative flex items-center gap-1">
          <span className="truncate">
            {suites
              .slice(0, MAX_VISIBLE)
              .map((s) => s.name)
              .join(', ')}
          </span>
          {suites.length - MAX_VISIBLE > 0 && (
            <>
              <button
                onClick={() => setShowSourceDropdown(!showSourceDropdown)}
                className="bg-bg-4 text-text-2 hover:bg-bg-3 hover:text-text-1 inline-flex cursor-pointer items-center rounded px-1 py-0.5 text-[10px] font-medium transition-colors"
              >
                +{suites.length - MAX_VISIBLE}
                <ChevronDown
                  className={`ml-0.5 h-2.5 w-2.5 transition-transform ${showSourceDropdown ? 'rotate-180' : ''}`}
                />
              </button>
              {showSourceDropdown && (
                <span className="rounded-2 border-line-2 bg-bg-1 text-text-2 shadow-2 absolute top-full left-0 z-20 mt-1 w-max max-w-xs border px-3 py-2 text-xs">
                  {suites.map((s, i) => (
                    <span key={i} className="block py-0.5">
                      {s.name}
                    </span>
                  ))}
                </span>
              )}
            </>
          )}
          {milestoneSource && (
            <span className="text-text-4 ml-1">| 마일스톤: {milestoneSource.name}</span>
          )}
        </span>
      )}
    </div>
  );
};
