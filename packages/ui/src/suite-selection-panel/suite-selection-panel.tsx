'use client';
import React, { useEffect, useRef, useState } from 'react';

import { cn } from '@testea/util';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, FolderOpen, Search } from 'lucide-react';

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
}

export const SuiteSelectionPanel = ({
  allSuites,
  selectedSuiteIds,
  onToggleSuite,
  isExpanded,
  onToggleExpand,
}: SuiteSelectionPanelProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  const filteredSuites = allSuites.filter((suite) => {
    const search = searchQuery.toLowerCase().trim();
    if (!search) return true;
    return (
      suite.title.toLowerCase().includes(search) ||
      suite.description?.toLowerCase().includes(search)
    );
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
          <FolderOpen className="text-primary h-5 w-5" />
          <span className="text-text-1 font-medium">테스트 스위트</span>
          {selectedSuiteIds.size > 0 && (
            <span className="bg-primary rounded-full px-2 py-0.5 text-xs text-white">
              {selectedSuiteIds.size}개 선택
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
                    placeholder="스위트 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="text-text-1 placeholder:text-text-3 w-full bg-transparent text-sm outline-none"
                  />
                </div>
              </div>

              {/* 리스트 */}
              <div className="max-h-[200px] overflow-y-auto">
                {filteredSuites.length === 0 ? (
                  <div className="text-text-3 py-8 text-center text-sm">
                    {allSuites.length === 0 ? '테스트 스위트가 없습니다.' : '검색 결과가 없습니다.'}
                  </div>
                ) : (
                  filteredSuites.map((suite) => (
                    <div
                      key={suite.id}
                      onClick={() => onToggleSuite(suite.id)}
                      className="hover:bg-bg-3 flex cursor-pointer items-center gap-3 px-4 py-2 transition-colors"
                    >
                      <div
                        className={cn(
                          'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                          selectedSuiteIds.has(suite.id)
                            ? 'border-primary bg-primary text-white'
                            : 'border-line-2 bg-bg-3'
                        )}
                      >
                        {selectedSuiteIds.has(suite.id) && <Check className="h-3 w-3" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-text-1 truncate text-sm">{suite.title}</span>
                        {suite.description && (
                          <p className="text-text-3 truncate text-xs">{suite.description}</p>
                        )}
                      </div>
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
