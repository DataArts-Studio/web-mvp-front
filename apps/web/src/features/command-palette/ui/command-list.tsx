'use client';

import React, { forwardRef } from 'react';
import { Clock, Zap } from 'lucide-react';
import { CommandItem } from './command-item';
import type { CommandItem as CommandItemType, CommandItemCategory } from '../model/types';

const CATEGORY_LABELS: Record<CommandItemCategory, string> = {
  action: '빠른 액션',
  recent: '최근 방문',
  testCase: '테스트 케이스',
  testSuite: '테스트 스위트',
  milestone: '마일스톤',
  testRun: '테스트 실행',
};

interface CommandGroup {
  category: CommandItemCategory;
  items: CommandItemType[];
}

interface CommandListProps {
  displayItems: CommandItemType[];
  groupedItems: CommandGroup[];
  query: string;
  activeIndex: number;
  onSelect: (item: CommandItemType) => void;
  onActiveIndexChange: (index: number) => void;
}

export const CommandList = forwardRef<HTMLDivElement, CommandListProps>(
  ({ displayItems, groupedItems, query, activeIndex, onSelect, onActiveIndexChange }, ref) => {
    let itemIndex = -1;

    return (
      <div ref={ref} className="max-h-[360px] overflow-y-auto p-2">
        {displayItems.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-text-4 typo-body-normal">
            {query.trim() ? '검색 결과가 없습니다' : '데이터를 불러오는 중...'}
          </div>
        ) : (
          groupedItems.map((group) => (
            <div key={group.category} className="mb-1 last:mb-0">
              <div className="flex items-center gap-2 px-3 py-1.5">
                {group.category === 'action' && <Zap size={12} className="text-text-4" />}
                {group.category === 'recent' && <Clock size={12} className="text-text-4" />}
                <span className="typo-label-heading text-text-4 uppercase tracking-wider">
                  {CATEGORY_LABELS[group.category]}
                </span>
              </div>
              {group.items.map((item) => {
                itemIndex++;
                const currentIndex = itemIndex;
                return (
                  <CommandItem
                    key={item.id}
                    item={item}
                    isActive={currentIndex === activeIndex}
                    onSelect={() => onSelect(item)}
                    onMouseEnter={() => onActiveIndexChange(currentIndex)}
                  />
                );
              })}
            </div>
          ))
        )}
      </div>
    );
  },
);

CommandList.displayName = 'CommandList';
