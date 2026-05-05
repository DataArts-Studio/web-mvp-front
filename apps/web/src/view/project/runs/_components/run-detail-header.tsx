'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@testea/util';
import { useOutsideClick } from '@testea/lib';
import { RUN_STATUS_CONFIG } from '@testea/ui';
import { ShareButton } from '@/features/runs-share/ui/share-button';
import { ArrowLeft, Keyboard, Pencil, Check, X, ChevronDown, BarChart3 } from 'lucide-react';
import { SOURCE_TYPE_CONFIG } from './run-detail-constants';
import { type TestRunDetail } from '@/entities/test-run';
import { type SourceInfo } from '@/entities/test-run';
import { formatDateKR } from '@testea/util';

interface RunDetailHeaderProps {
  testRun: TestRunDetail;
  projectSlug: string;
  testRunId: string;
  onRename: (name: string) => void;
  isRenaming: boolean;
  onShowShortcuts: () => void;
  showCharts: boolean;
  onToggleCharts: () => void;
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
    <header className="border-line-2 border-b bg-bg-1 px-6 py-3">
      <div className="flex items-center gap-3">
        {/* Back */}
        <Link
          href={`/projects/${projectSlug}/runs`}
          className="text-text-3 hover:text-text-1 transition-colors shrink-0"
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
                  className="text-base font-semibold bg-bg-2 border border-line-2 rounded-1 px-2 py-0.5 text-text-1 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Escape') setIsEditingTitle(false); }}
                  disabled={isRenaming}
                />
                <button type="submit" className="text-primary hover:text-primary/80" disabled={isRenaming}>
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => setIsEditingTitle(false)} className="text-text-3 hover:text-text-1" disabled={isRenaming}>
                  <X className="h-3.5 w-3.5" />
                </button>
              </form>
            ) : (
              <button
                className="group/title flex min-w-0 items-center gap-1.5 text-base font-semibold hover:text-primary transition-colors"
                onClick={() => { setEditTitle(testRun.name); setIsEditingTitle(true); }}
                title={testRun.name}
              >
                <span className="truncate">{testRun.name}</span>
                <Pencil className="h-3 w-3 shrink-0 text-text-4 opacity-0 group-hover/title:opacity-100 transition-opacity" />
              </button>
            )}
            <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium shrink-0', statusInfo.style)}>
              {statusInfo.label}
            </span>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-0.5">
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
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onToggleCharts}
            className={cn(
              'rounded-1 p-1.5 text-text-3 hover:text-text-1 hover:bg-bg-2 transition-colors',
              showCharts && 'text-primary bg-primary/10 hover:text-primary',
            )}
            aria-label="통계 차트 토글"
            title="통계 차트"
          >
            <BarChart3 className="h-4 w-4" />
          </button>
          <button
            onClick={onShowShortcuts}
            className="rounded-1 p-1.5 text-text-3 hover:text-text-1 hover:bg-bg-2 transition-colors"
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
  const suites = sources.filter(s => s.type === 'suite');
  const milestoneSource = sources.find(s => s.type === 'milestone');
  const MAX_VISIBLE = 2;

  return (
    <div className="text-text-3 flex items-center gap-1.5 text-xs" ref={sourceDropdownRef}>
      <span className="shrink-0 [&_svg]:h-3 [&_svg]:w-3">{sourceInfo.icon}</span>
      {suites.length === 0 ? (
        <span className="truncate">{sourceName}</span>
      ) : (
        <span className="relative flex items-center gap-1">
          <span className="truncate">{suites.slice(0, MAX_VISIBLE).map(s => s.name).join(', ')}</span>
          {suites.length - MAX_VISIBLE > 0 && (
            <>
              <button
                onClick={() => setShowSourceDropdown(!showSourceDropdown)}
                className="inline-flex items-center rounded bg-bg-4 px-1 py-0.5 text-[10px] font-medium text-text-2 hover:bg-bg-3 hover:text-text-1 transition-colors cursor-pointer"
              >
                +{suites.length - MAX_VISIBLE}
                <ChevronDown className={`ml-0.5 h-2.5 w-2.5 transition-transform ${showSourceDropdown ? 'rotate-180' : ''}`} />
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
          {milestoneSource && <span className="ml-1 text-text-4">| 마일스톤: {milestoneSource.name}</span>}
        </span>
      )}
    </div>
  );
};
