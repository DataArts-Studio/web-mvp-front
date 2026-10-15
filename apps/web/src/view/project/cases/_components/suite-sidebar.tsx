'use client';

import React from 'react';

import { useTranslations } from 'next-intl';

import { cn } from '@testea/util';

interface Suite {
  id: string;
  title: string;
  caseCount?: number;
}

interface SuiteSidebarProps {
  suites: Suite[];
  selectedSuiteId: string;
  totalItems?: number;
  onSuiteChange: (id: string) => void;
}

const SuiteItem = ({
  label,
  count,
  active,
  muted,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  muted?: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onClick}
    className={cn(
      'flex w-full items-center gap-2 rounded-[6px] px-2 py-[7px] text-left text-[13px] transition-colors',
      active
        ? 'bg-white/[0.07] font-medium text-white'
        : muted
          ? 'text-white/45 hover:bg-white/[0.04] hover:text-white/70'
          : 'text-white/70 hover:bg-white/[0.04] hover:text-white'
    )}
  >
    <span className="min-w-0 flex-1 truncate">{label}</span>
    {count != null && <span className="shrink-0 font-mono text-[11px] text-white/35">{count}</span>}
  </button>
);

export const SuiteSidebar = ({
  suites,
  selectedSuiteId,
  totalItems,
  onSuiteChange,
}: SuiteSidebarProps) => {
  const t = useTranslations('cases');
  return (
    <nav
      aria-label={t('ui.suiteFilterAriaLabel')}
      className="border-line-2 hidden w-[236px] shrink-0 flex-col overflow-y-auto border-r px-6 py-5 md:flex"
    >
      <h2 className="mb-2 px-2 text-[11px] text-white/40">{t('ui.suites')}</h2>
      <SuiteItem
        label={t('ui.allCases')}
        count={totalItems}
        active={selectedSuiteId === 'all'}
        onClick={() => onSuiteChange('all')}
      />
      <div className="my-1 border-t border-white/[0.06]" />
      <div className="flex flex-col gap-px">
        {suites.map((suite) => (
          <SuiteItem
            key={suite.id}
            label={suite.title}
            count={suite.caseCount}
            active={selectedSuiteId === suite.id}
            onClick={() => onSuiteChange(suite.id)}
          />
        ))}
        <SuiteItem
          label={t('ui.uncategorized')}
          active={selectedSuiteId === '__uncategorized__'}
          muted
          onClick={() => onSuiteChange('__uncategorized__')}
        />
      </div>
    </nav>
  );
};
