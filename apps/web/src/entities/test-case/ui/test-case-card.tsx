'use client';

import React, { useState } from 'react';

import { useTranslations } from 'next-intl';

import type { TestCaseCardType, TestCaseResultStatus } from '@/entities/test-case';
import { formatRelativeTime } from '@testea/util';
import { cn } from '@testea/util';
import { Copy, MoreHorizontal } from 'lucide-react';

const STATUS_CONFIG: Record<TestCaseResultStatus, { dot: string; label: string }> = {
  untested: { dot: 'bg-text-4', label: '미실행' },
  pass: { dot: 'bg-emerald-500', label: '통과' },
  fail: { dot: 'bg-red-500', label: '실패' },
  blocked: { dot: 'bg-amber-500', label: '차단' },
};

interface TestCaseCardProps {
  testCase: TestCaseCardType;
  onDuplicate?: (testCaseId: string) => void;
}

export const TestCaseCard = ({ testCase, onDuplicate }: TestCaseCardProps) => {
  const t = useTranslations('cases');
  const status = STATUS_CONFIG[testCase.resultStatus] ?? STATUS_CONFIG.untested;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="grid w-full min-w-0 grid-cols-1 gap-2 md:grid-cols-[88px_minmax(0,1fr)_180px_96px_112px_32px] md:items-center md:gap-4">
      <span className="typo-caption-heading text-text-4 tabular-nums">{testCase.caseKey}</span>

      <div className="min-w-0">
        <p className="typo-body2-heading text-text-1 group-hover:text-primary truncate transition-colors">
          {testCase.title}
        </p>
      </div>

      <span className="typo-caption-normal text-text-3 truncate">
        {testCase.suiteTitle || '미분류'}
      </span>

      <span className="typo-caption-normal text-text-3 inline-flex items-center gap-1.5">
        <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} aria-hidden="true" />
        {status.label}
      </span>

      <span className="typo-caption-normal text-text-4 md:text-right">
        {formatRelativeTime(testCase.updatedAt)}
      </span>

      <div className="relative flex shrink-0 items-center md:justify-end">
        <button
          type="button"
          aria-label={t('ui.caseActions')}
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          className="text-text-4 hover:bg-bg-3 hover:text-text-1 focus-visible:ring-primary flex h-8 w-8 cursor-pointer items-center justify-center opacity-0 transition-all group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:outline-none"
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
              aria-label={t('ui.caseActions')}
              className="bg-bg-2 border-line-2 absolute top-full right-0 z-50 mt-1 min-w-[120px] border py-1 shadow-lg"
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
                {t('ui.duplicate')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
