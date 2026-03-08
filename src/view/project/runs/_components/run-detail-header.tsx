'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/shared/utils';
import { useOutsideClick } from '@/shared/hooks';
import { RUN_STATUS_CONFIG } from '@/shared/ui';
import { ShareButton } from '@/features/runs-share/ui/share-button';
import { ArrowLeft, Keyboard, Pencil, Check, X, ChevronDown } from 'lucide-react';
import { STATUS_CONFIG, SOURCE_TYPE_CONFIG } from './run-detail-constants';
import { type TestRunDetail } from '@/entities/test-run';
import { type SourceInfo } from '@/entities/test-run';

interface RunDetailHeaderProps {
  testRun: TestRunDetail;
  projectSlug: string;
  testRunId: string;
  onRename: (name: string) => void;
  isRenaming: boolean;
  onShowShortcuts: () => void;
}

export const RunDetailHeader = ({
  testRun,
  projectSlug,
  testRunId,
  onRename,
  isRenaming,
  onShowShortcuts,
}: RunDetailHeaderProps) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const sourceDropdownRef = useRef<HTMLDivElement>(null);

  useOutsideClick(sourceDropdownRef, () => setShowSourceDropdown(false), showSourceDropdown);

  // Close editing when rename completes (success or error)
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
    <header className="border-line-2 flex items-center justify-between border-b px-6 py-4">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <Link
          href={`/projects/${projectSlug}/runs`}
          className="text-text-3 hover:text-text-1 flex items-center gap-1 transition-colors"
          aria-label="테스트 실행 목록으로 돌아가기"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            {isEditingTitle ? (
              <form
                className="flex items-center gap-2"
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
                  className="text-lg font-semibold bg-bg-2 border border-line-2 rounded-2 px-2 py-0.5 text-text-1 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setIsEditingTitle(false);
                  }}
                  disabled={isRenaming}
                />
                <button
                  type="submit"
                  className="text-primary hover:text-primary/80 transition-colors"
                  disabled={isRenaming}
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingTitle(false)}
                  className="text-text-3 hover:text-text-1 transition-colors"
                  disabled={isRenaming}
                >
                  <X className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <button
                className="group/title flex min-w-0 items-center gap-2 text-lg font-semibold hover:text-primary transition-colors"
                onClick={() => {
                  setEditTitle(testRun.name);
                  setIsEditingTitle(true);
                }}
                title={testRun.name}
              >
                <span className="truncate">{testRun.name}</span>
                <Pencil className="h-3.5 w-3.5 flex-shrink-0 text-text-4 opacity-0 group-hover/title:opacity-100 transition-opacity" />
              </button>
            )}
            <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', statusInfo.style)}>
              {statusInfo.label}
            </span>
          </div>
          <SourceInfoDisplay
            sourceInfo={sourceInfo}
            sources={testRun.sources}
            sourceName={testRun.sourceName}
            showSourceDropdown={showSourceDropdown}
            setShowSourceDropdown={setShowSourceDropdown}
            sourceDropdownRef={sourceDropdownRef}
          />
        </div>
      </div>

      {/* Progress Stats */}
      <div className="flex shrink-0 items-center gap-6">
        <div className="flex items-center gap-4">
          {(['pass', 'fail', 'blocked', 'untested'] as const).map((status) => (
            <div key={status} className={cn('flex items-center gap-1.5', STATUS_CONFIG[status].style)}>
              {STATUS_CONFIG[status].icon}
              <span className="text-sm font-medium">{testRun.stats[status]}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-bg-3 h-2 w-32 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${testRun.stats.progressPercent}%` }}
            />
          </div>
          <span className="text-text-2 text-sm font-medium">{testRun.stats.progressPercent}%</span>
        </div>
        <ShareButton
          testRunId={testRunId}
          shareToken={testRun.shareToken}
          shareExpiresAt={testRun.shareExpiresAt}
        />
        <button
          onClick={onShowShortcuts}
          className="text-text-3 hover:text-text-1 flex items-center gap-1 text-sm transition-colors"
          aria-label="키보드 단축키 보기"
        >
          <Keyboard className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
};

// --- Sub-component for source info display ---

interface SourceInfoDisplayProps {
  sourceInfo: { label: string; icon: React.ReactNode };
  sources: SourceInfo[];
  sourceName: string;
  showSourceDropdown: boolean;
  setShowSourceDropdown: (show: boolean) => void;
  sourceDropdownRef: React.RefObject<HTMLDivElement | null>;
}

const SourceInfoDisplay = ({
  sourceInfo,
  sources,
  sourceName,
  showSourceDropdown,
  setShowSourceDropdown,
  sourceDropdownRef,
}: SourceInfoDisplayProps) => {
  const suites = sources.filter(s => s.type === 'suite');
  const milestoneSource = sources.find(s => s.type === 'milestone');
  const MAX_VISIBLE = 2;

  return (
    <div className="text-text-3 flex items-center gap-2 text-sm" ref={sourceDropdownRef}>
      {sourceInfo.icon}
      {suites.length === 0 ? (
        <span>{sourceName}</span>
      ) : (
        <span className="relative flex items-center gap-1">
          <span>{suites.slice(0, MAX_VISIBLE).map(s => s.name).join(', ')}</span>
          {suites.length - MAX_VISIBLE > 0 && (
            <>
              <button
                onClick={() => setShowSourceDropdown(!showSourceDropdown)}
                className="inline-flex items-center rounded-1 bg-bg-4 px-1 py-0.5 text-[10px] font-medium text-text-2 hover:bg-bg-3 hover:text-text-1 transition-colors cursor-pointer"
              >
                +{suites.length - MAX_VISIBLE}
                <ChevronDown className={`ml-0.5 h-3 w-3 transition-transform ${showSourceDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showSourceDropdown && (
                <span className="absolute top-full left-0 z-20 mt-1 w-max max-w-xs rounded-2 border border-line-2 bg-bg-1 px-3 py-2 text-xs text-text-2 shadow-2">
                  {suites.map((s, i) => (
                    <span key={i} className="block py-0.5">{s.name}</span>
                  ))}
                </span>
              )}
            </>
          )}
          {milestoneSource && <span className="ml-1">| 마일스톤: {milestoneSource.name}</span>}
        </span>
      )}
    </div>
  );
};
