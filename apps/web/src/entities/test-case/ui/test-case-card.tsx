'use client';

import React, { useState } from 'react';

import type { TestCaseCardType, TestCaseResultStatus } from '@/entities/test-case';
import { formatRelativeTime } from '@testea/util';
import { cn } from '@testea/util';
import { Copy, MoreHorizontal } from 'lucide-react';

const STATUS_CONFIG: Record<
  TestCaseResultStatus,
  { bar: string; dot: string; label: string; badge: string }
> = {
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
    <div className="flex w-full min-w-0 items-stretch gap-0">
      {/* Left color bar */}
      <div className={cn('w-[3px] shrink-0 self-stretch rounded-full', status.bar)} />

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-1 pl-3">
        {/* Line 1: caseKey + title + time */}
        <div className="flex min-w-0 items-center gap-3">
          <span className="typo-caption-normal text-text-3 shrink-0">{testCase.caseKey}</span>
          <span className="typo-body2-normal text-text-1 group-hover:text-primary w-[600px] shrink-0 truncate transition-colors">
            {testCase.title}
          </span>
          <span className="typo-caption-normal text-text-4 ml-auto shrink-0">
            {formatRelativeTime(testCase.updatedAt)}
          </span>
        </div>

        {/* Line 2: status badge + suite pill */}
        <div className="flex items-center gap-2">
          {testCase.resultStatus !== 'untested' && (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                status.badge
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
              {status.label}
            </span>
          )}

          {testCase.suiteTitle && (
            <span className="bg-bg-3 text-text-3 inline-flex max-w-[160px] items-center truncate rounded-full px-2 py-0.5 text-xs">
              {testCase.suiteTitle}
            </span>
          )}
        </div>
      </div>

      {/* Hover-reveal menu */}
      <div className="relative flex shrink-0 items-center pl-2">
        <button
          type="button"
          aria-label="케이스 작업"
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          className="rounded-1 text-text-4 hover:bg-bg-4 hover:text-text-1 focus-visible:ring-primary cursor-pointer p-1 opacity-0 transition-all group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:outline-none"
          onClick={(e) => {
            e.stopPropagation();
            setIsMenuOpen((prev) => !prev);
          }}
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
        </button>
        {isMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              aria-hidden="true"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(false);
              }}
            />
            <div
              role="menu"
              aria-label="케이스 작업"
              className="bg-bg-2 border-line-2 rounded-2 absolute top-full right-0 z-50 mt-1 min-w-[120px] border py-1 shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                className="text-text-2 hover:bg-bg-3 flex w-full items-center gap-2 px-3 py-2 text-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                  onDuplicate?.(testCase.id);
                }}
              >
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                복제
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
