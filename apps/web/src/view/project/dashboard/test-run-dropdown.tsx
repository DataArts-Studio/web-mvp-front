'use client';

import React, { useState, useRef } from 'react';
import { useOutsideClick } from '@/shared/hooks/use-outside-click';
import { ChevronDown } from 'lucide-react';
import { track, DASHBOARD_EVENTS } from '@/shared/lib/analytics';

type TestRun = {
  id: string;
  name: string;
  status: string;
  stats: {
    totalCases: number;
    progressPercent: number;
    pass: number;
    fail: number;
    blocked: number;
    untested: number;
  };
};

type TestRunDropdownProps = {
  testRuns: TestRun[];
  selectedRunId: string | null;
  onSelect: (id: string) => void;
  slug: string;
  selectedRunName?: string;
};

export const TestRunDropdown = React.memo(({
  testRuns,
  selectedRunId,
  onSelect,
  slug,
  selectedRunName,
}: TestRunDropdownProps) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useOutsideClick(dropdownRef, () => setShowDropdown(false));

  if (testRuns.length === 0) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown((prev) => !prev)}
        className="border-primary/40 text-text-1 rounded-4 flex items-center gap-2 border bg-transparent px-3 py-1.5 transition-colors hover:border-primary cursor-pointer"
      >
        <span className="typo-label-normal max-w-[200px] truncate">
          {selectedRunName || '테스트 실행 선택'}
        </span>
        <ChevronDown className={`text-text-3 h-4 w-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>
      {showDropdown && (
        <div className="bg-bg-3 border-line-2 rounded-4 shadow-3 absolute right-0 top-full z-20 mt-1 min-w-[240px] border py-1">
          {testRuns.map((run) => (
            <button
              key={run.id}
              onClick={() => {
                track(DASHBOARD_EVENTS.CHART_INTERACTION, { project_id: slug, run_id: run.id });
                onSelect(run.id);
                setShowDropdown(false);
              }}
              className={`flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-bg-4 ${
                run.id === selectedRunId ? 'bg-bg-4' : ''
              }`}
            >
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  run.status === 'IN_PROGRESS'
                    ? 'bg-primary'
                    : run.status === 'COMPLETED'
                      ? 'bg-text-3'
                      : 'bg-text-4'
                }`}
              />
              <div className="flex flex-1 flex-col">
                <span className="typo-label-normal text-text-1 truncate">{run.name}</span>
                <span className="typo-caption text-text-3">
                  {run.stats.totalCases}개 케이스 · {run.stats.progressPercent}% 완료
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

TestRunDropdown.displayName = 'TestRunDropdown';
