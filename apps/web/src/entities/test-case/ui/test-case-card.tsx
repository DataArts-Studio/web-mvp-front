'use client';

import React, { useState } from 'react';

import type { TestCaseCardType, TestCaseResultStatus } from '@/entities/test-case';
import { Copy, MoreHorizontal } from 'lucide-react';
import { formatRelativeTime } from '@testea/util';
import { cn } from '@testea/util';

const STATUS_CONFIG: Record<TestCaseResultStatus, { bar: string; dot: string; label: string; badge: string }> = {
  untested: {
    bar: 'bg-text-4',
    dot: 'bg-text-4',
    label: 'Untested',
    badge: 'bg-bg-3 text-text-3',
  },
  pass: {
    bar: 'bg-emerald-500',
    dot: 'bg-emerald-500',
    label: 'Pass',
    badge: 'bg-emerald-500/10 text-emerald-600',
  },
  fail: {
    bar: 'bg-red-500',
    dot: 'bg-red-500',
    label: 'Fail',
    badge: 'bg-red-500/10 text-red-600',
  },
  blocked: {
    bar: 'bg-amber-500',
    dot: 'bg-amber-500',
    label: 'Blocked',
    badge: 'bg-amber-500/10 text-amber-600',
  },
};

interface TestCaseCardProps {
  testCase: TestCaseCardType;
  onDuplicate?: (testCaseId: string) => void;
}

export const TestCaseCard = ({ testCase, onDuplicate }: TestCaseCardProps) => {
  const status = STATUS_CONFIG[testCase.resultStatus] ?? STATUS_CONFIG.untested;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="flex items-stretch gap-0 w-full min-w-0">
      {/* Left color bar */}
      <div className={cn('w-[3px] shrink-0 rounded-full self-stretch', status.bar)} />

      {/* Content */}
      <div className="flex flex-1 flex-col gap-1 pl-3 min-w-0">
        {/* Line 1: caseKey + title + time */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="typo-caption-normal text-text-3 shrink-0">
            {testCase.caseKey}
          </span>
          <span className="typo-body2-normal text-text-1 w-[600px] shrink-0 truncate group-hover:text-primary transition-colors">
            {testCase.title}
          </span>
          <span className="typo-caption-normal text-text-4 ml-auto shrink-0">
            {formatRelativeTime(testCase.updatedAt)}
          </span>
        </div>

        {/* Line 2: status badge + suite pill */}
        <div className="flex items-center gap-2">
          {testCase.resultStatus !== 'untested' && (
            <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', status.badge)}>
              <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
              {status.label}
            </span>
          )}

          {testCase.suiteTitle && (
            <span className="inline-flex items-center rounded-full bg-bg-3 px-2 py-0.5 text-xs text-text-3 truncate max-w-[160px]">
              {testCase.suiteTitle}
            </span>
          )}
        </div>
      </div>

      {/* Hover-reveal menu */}
      <div className="flex items-center shrink-0 pl-2 relative">
        <button
          className="rounded-1 text-text-4 hover:bg-bg-4 hover:text-text-1 p-1 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            setIsMenuOpen((prev) => !prev);
          }}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        {isMenuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); }} />
            <div className="bg-bg-2 border-line-2 absolute right-0 top-full z-50 mt-1 rounded-2 border py-1 shadow-lg min-w-[120px]">
              <button
                type="button"
                className="text-text-2 hover:bg-bg-3 flex w-full items-center gap-2 px-3 py-2 text-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                  onDuplicate?.(testCase.id);
                }}
              >
                <Copy className="h-3.5 w-3.5" />
                복제
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
