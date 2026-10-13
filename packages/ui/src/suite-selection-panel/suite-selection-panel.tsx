'use client';
import React, { useState } from 'react';

import { cn } from '@testea/util';
import { Check, ChevronDown, ChevronUp, FolderOpen, Search } from 'lucide-react';

interface TestSuiteItem {
  id: string;
  title: string;
  description?: string;
}

interface SuiteSelectionPanelProps {
  allSuites: TestSuiteItem[];
  selectedSuiteIds: Set<string>;
  onToggleSuite: (id: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  /** 스위트 목록을 불러오는 중이면 빈 상태 대신 불러오는 중으로 보여 준다. */
  isLoading?: boolean;
}

export const SuiteSelectionPanel = ({
  allSuites,
  selectedSuiteIds,
  onToggleSuite,
  isExpanded,
  onToggleExpand,
  isLoading = false,
}: SuiteSelectionPanelProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSuites = allSuites.filter((suite) => {
    const search = searchQuery.toLowerCase().trim();
    if (!search) return true;
    return (
      suite.title.toLowerCase().includes(search) ||
      suite.description?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="border-line-2 rounded-lg border">
      <button
        type="button"
        onClick={onToggleExpand}
        aria-expanded={isExpanded}
        className="hover:bg-bg-3 flex w-full items-center justify-between px-4 py-3 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FolderOpen className="text-primary h-5 w-5" aria-hidden="true" />
          <span className="text-text-1 font-medium">테스트 스위트</span>
          {selectedSuiteIds.size > 0 && (
            <span className="bg-primary rounded-full px-2 py-0.5 text-xs text-white">
              {selectedSuiteIds.size}개 선택
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="text-text-3 h-5 w-5" />
        ) : (
          <ChevronDown className="text-text-3 h-5 w-5" />
        )}
      </button>

      {isExpanded && (
        <div className="border-line-2 border-t">
          {/* 검색 */}
          <div className="border-line-2 border-b px-4 py-2">
            <div className="bg-bg-3 flex items-center gap-2 rounded-lg px-3 py-2">
              <Search className="text-text-3 h-4 w-4" aria-hidden="true" />
              <input
                type="search"
                aria-label="스위트 검색"
                placeholder="스위트 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-text-1 placeholder:text-text-3 w-full bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          {/* 리스트 */}
          <div className="max-h-[200px] overflow-y-auto">
            {isLoading ? (
              <div role="status" className="text-text-3 py-8 text-center text-sm">
                스위트를 불러오는 중이에요...
              </div>
            ) : filteredSuites.length === 0 ? (
              <div className="text-text-3 py-8 text-center text-sm">
                {allSuites.length === 0 ? '테스트 스위트가 없습니다.' : '검색 결과가 없습니다.'}
              </div>
            ) : (
              filteredSuites.map((suite) => (
                <button
                  key={suite.id}
                  type="button"
                  role="checkbox"
                  aria-checked={selectedSuiteIds.has(suite.id)}
                  onClick={() => onToggleSuite(suite.id)}
                  className="hover:bg-bg-3 flex w-full cursor-pointer items-center gap-3 px-4 py-2 text-left transition-colors"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                      selectedSuiteIds.has(suite.id)
                        ? 'border-primary bg-primary text-white'
                        : 'border-line-2 bg-bg-3'
                    )}
                  >
                    {selectedSuiteIds.has(suite.id) && <Check className="h-3 w-3" />}
                  </span>
                  <span className="block min-w-0 flex-1">
                    <span className="text-text-1 block truncate text-sm">{suite.title}</span>
                    {suite.description && (
                      <span className="text-text-3 block truncate text-xs">
                        {suite.description}
                      </span>
                    )}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
