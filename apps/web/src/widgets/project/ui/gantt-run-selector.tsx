import React, { useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useOutsideClick } from '@testea/lib';
import type { FetchedTestRun } from '@/features/runs';

type GanttRunSelectorProps = {
  testRuns: FetchedTestRun[];
  selectedRunId: string | null;
  onRunChangeAction: (runId: string | null) => void;
};

export const GanttRunSelector = ({
  testRuns,
  selectedRunId,
  onRunChangeAction,
}: GanttRunSelectorProps) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useOutsideClick(dropdownRef, () => setShowDropdown(false));

  const selectedRun = testRuns.find((r) => r.id === selectedRunId);

  return (
    <div className="mb-5 flex items-center" ref={dropdownRef}>
      <div className="relative">
        <button
          onClick={() => setShowDropdown((prev) => !prev)}
          className="border-primary/40 text-text-1 rounded-4 flex items-center gap-2 border bg-transparent px-3 py-1.5 transition-colors hover:border-primary cursor-pointer"
        >
          <span className="typo-label-normal max-w-[200px] truncate">
            {selectedRun?.name || '테스트 실행 선택'}
          </span>
          <ChevronDown
            className={`text-text-3 h-4 w-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
          />
        </button>
        {showDropdown && (
          <div className="bg-bg-3 border-line-2 rounded-4 shadow-3 absolute left-0 top-full z-20 mt-1 min-w-[240px] border py-1">
            {testRuns.map((run) => (
              <button
                key={run.id}
                onClick={() => {
                  onRunChangeAction(run.id);
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
                <span className="typo-label-normal text-text-1 truncate">
                  {run.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
