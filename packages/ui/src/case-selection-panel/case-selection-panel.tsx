'use client';
import React, { useEffect, useRef, useState } from 'react';

import { cn } from '@testea/util';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, ListChecks, Search } from 'lucide-react';

interface TestCaseItem {
  id: string;
  caseKey: string;
  title: string;
}

interface CaseSelectionPanelProps {
  allCases: TestCaseItem[];
  selectedCaseIds: Set<string>;
  onToggleCase: (id: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const CaseSelectionPanel = ({
  allCases,
  selectedCaseIds,
  onToggleCase,
  isExpanded,
  onToggleExpand,
}: CaseSelectionPanelProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  const filteredCases = allCases.filter((tc) => {
    const search = searchQuery.toLowerCase().trim();
    if (!search) return true;
    return tc.title.toLowerCase().includes(search) || tc.caseKey.toLowerCase().includes(search);
  });

  // 펼칠 때 패널을 스크롤 컨테이너 안으로 가져온다(높이 애니메이션 종료 후).
  useEffect(() => {
    if (!isExpanded) return;
    const timer = setTimeout(() => {
      rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 230);
    return () => clearTimeout(timer);
  }, [isExpanded]);

  return (
    <div ref={rootRef} className="border-line-2 rounded-lg border">
      <button
        type="button"
        onClick={onToggleExpand}
        className="hover:bg-bg-3 flex w-full items-center justify-between px-4 py-3 transition-colors"
      >
        <div className="flex items-center gap-2">
          <ListChecks className="text-primary h-5 w-5" />
          <span className="text-text-1 font-medium">테스트 케이스</span>
          {selectedCaseIds.size > 0 && (
            <span className="bg-primary rounded-full px-2 py-0.5 text-xs text-white">
              {selectedCaseIds.size}개 선택
            </span>
          )}
        </div>
        <motion.span
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="text-text-3 inline-flex"
        >
          <ChevronDown className="h-5 w-5" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="border-line-2 border-t">
              {/* 검색 */}
              <div className="border-line-2 border-b px-4 py-2">
                <div className="bg-bg-3 flex items-center gap-2 rounded-lg px-3 py-2">
                  <Search className="text-text-3 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="케이스 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="text-text-1 placeholder:text-text-3 w-full bg-transparent text-sm outline-none"
                  />
                </div>
              </div>

              {/* 리스트 */}
              <div className="max-h-[200px] overflow-y-auto">
                {filteredCases.length === 0 ? (
                  <div className="text-text-3 py-8 text-center text-sm">
                    {allCases.length === 0 ? '테스트 케이스가 없습니다.' : '검색 결과가 없습니다.'}
                  </div>
                ) : (
                  filteredCases.map((tc) => (
                    <div
                      key={tc.id}
                      onClick={() => onToggleCase(tc.id)}
                      className="hover:bg-bg-3 flex cursor-pointer items-center gap-3 px-4 py-2 transition-colors"
                    >
                      <div
                        className={cn(
                          'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                          selectedCaseIds.has(tc.id)
                            ? 'border-primary bg-primary text-white'
                            : 'border-line-2 bg-bg-3'
                        )}
                      >
                        {selectedCaseIds.has(tc.id) && <Check className="h-3 w-3" />}
                      </div>
                      <span className="text-primary shrink-0 font-mono text-xs">{tc.caseKey}</span>
                      <span className="text-text-1 truncate text-sm">{tc.title}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
