'use client';

import React from 'react';
import { FolderOpen, FolderClosed, Inbox } from 'lucide-react';
import { cn } from '@/shared/utils';

interface Suite {
  id: string;
  title: string;
}

interface SuiteSidebarProps {
  suites: Suite[];
  selectedSuiteId: string;
  totalItems?: number;
  onSuiteChange: (id: string) => void;
}

const itemClass = (active: boolean, muted?: boolean) =>
  cn(
    'flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors',
    active
      ? 'bg-primary/10 text-primary font-medium'
      : muted
        ? 'text-text-3 hover:bg-bg-2'
        : 'text-text-2 hover:bg-bg-2',
  );

export const SuiteSidebar = ({ suites, selectedSuiteId, totalItems, onSuiteChange }: SuiteSidebarProps) => (
  <nav className="border-line-2 bg-bg-1 flex h-screen w-60 shrink-0 flex-col border-r sticky top-0">
    <div className="border-line-2 border-b px-4 py-3">
      <h3 className="typo-body2-heading text-text-2">스위트</h3>
    </div>
    <div className="flex-1 overflow-y-auto py-1">
      {/* 전체 */}
      <button type="button" onClick={() => onSuiteChange('all')} className={itemClass(selectedSuiteId === 'all')}>
        <Inbox className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate">전체 케이스</span>
        {totalItems != null && <span className="text-text-3 text-xs">{totalItems}</span>}
      </button>

      {/* 스위트 목록 */}
      {suites.map((suite) => {
        const isSelected = selectedSuiteId === suite.id;
        return (
          <button key={suite.id} type="button" onClick={() => onSuiteChange(suite.id)} className={itemClass(isSelected)}>
            {isSelected ? <FolderOpen className="h-4 w-4 shrink-0" /> : <FolderClosed className="h-4 w-4 shrink-0" />}
            <span className="flex-1 truncate">{suite.title}</span>
          </button>
        );
      })}

      {/* 미분류 */}
      <button type="button" onClick={() => onSuiteChange('__uncategorized__')} className={itemClass(selectedSuiteId === '__uncategorized__', true)}>
        <Inbox className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate">미분류</span>
      </button>
    </div>
  </nav>
);
