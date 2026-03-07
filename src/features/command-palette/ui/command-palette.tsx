'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useRouter, useParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Search, Clock, Zap } from 'lucide-react';
import { useCommandPalette } from '../hooks/use-command-palette';
import { useCommandSearch } from '../hooks/use-command-search';
import { useRecentVisits } from '../hooks/use-recent-visits';
import { getQuickActions } from '../model/actions';
import { CommandItem } from './command-item';
import { dashboardQueryKeys } from '@/features/dashboard';
import type { CommandItem as CommandItemType, CommandItemCategory } from '../model/types';
import { FileText, FolderOpen, Flag, Play } from 'lucide-react';

const CATEGORY_LABELS: Record<CommandItemCategory, string> = {
  action: '빠른 액션',
  recent: '최근 방문',
  testCase: '테스트 케이스',
  testSuite: '테스트 스위트',
  milestone: '마일스톤',
  testRun: '테스트 실행',
};

const RECENT_TYPE_ICONS: Record<string, typeof FileText> = {
  testCase: FileText,
  testSuite: FolderOpen,
  milestone: Flag,
  testRun: Play,
};

export const CommandPalette = () => {
  const { isOpen, close } = useCommandPalette();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();

  const projectSlug = params.slug as string;

  // dashboard 캐시에서 projectId 가져오기
  const statsData = queryClient.getQueryData<{
    success: boolean;
    data: { project: { id: string } };
  }>(dashboardQueryKeys.stats(projectSlug));
  const projectId = statsData?.success ? statsData.data.project.id : undefined;

  const searchResults = useCommandSearch(query.startsWith('>') ? '' : query, projectSlug, projectId);
  const recentVisits = useRecentVisits(projectId ?? '');
  const quickActions = useMemo(() => getQuickActions(projectSlug), [projectSlug]);

  // 검색어 없을 때 표시할 아이템
  const defaultItems = useMemo((): CommandItemType[] => {
    const items: CommandItemType[] = [];

    // 빠른 액션
    for (const action of quickActions) {
      items.push(action);
    }

    // 최근 방문
    for (const visit of recentVisits) {
      items.push({
        id: `recent:${visit.type}:${visit.id}`,
        category: 'recent',
        icon: RECENT_TYPE_ICONS[visit.type] ?? FileText,
        title: visit.title,
        subtitle: '최근 방문',
        href: visit.path,
      });
    }

    return items;
  }, [quickActions, recentVisits]);

  // > 접두사: 액션 모드
  const actionItems = useMemo((): CommandItemType[] => {
    if (!query.startsWith('>')) return [];
    const actionQuery = query.slice(1).trim();
    if (!actionQuery) return quickActions;
    return quickActions.filter((a) =>
      a.title.toLowerCase().includes(actionQuery.toLowerCase()),
    );
  }, [query, quickActions]);

  const displayItems = query.startsWith('>')
    ? actionItems
    : query.trim()
      ? searchResults
      : defaultItems;

  // 카테고리별 그룹핑
  const groupedItems = useMemo(() => {
    const groups: { category: CommandItemCategory; items: CommandItemType[] }[] = [];
    const seen = new Set<CommandItemCategory>();

    for (const item of displayItems) {
      if (!seen.has(item.category)) {
        seen.add(item.category);
        groups.push({ category: item.category, items: [] });
      }
      groups.find((g) => g.category === item.category)!.items.push(item);
    }

    return groups;
  }, [displayItems]);

  // 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  // 활성 아이템 스크롤
  useEffect(() => {
    const activeEl = listRef.current?.querySelector('[data-active="true"]');
    activeEl?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  // 검색어 변경 시 인덱스 리셋
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const handleSelect = useCallback(
    (item: CommandItemType) => {
      close();
      if (item.onSelect) {
        item.onSelect();
      } else if (item.href) {
        router.push(item.href);
      }
    },
    [close, router],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((prev) => (prev + 1) % displayItems.length || 0);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((prev) =>
            prev <= 0 ? Math.max(displayItems.length - 1, 0) : prev - 1,
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (displayItems[activeIndex]) {
            handleSelect(displayItems[activeIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          close();
          break;
      }
    },
    [activeIndex, displayItems, handleSelect, close],
  );

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || !isOpen) return null;

  let itemIndex = -1;

  return ReactDOM.createPortal(
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[1000] bg-black/50"
        onClick={close}
        aria-hidden="true"
      />

      {/* Palette */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="커맨드 팔레트"
        data-command-palette
        className="fixed left-1/2 top-[20%] z-[1001] w-full max-w-[640px] -translate-x-1/2 overflow-hidden rounded-5 border border-line-2 bg-bg-2 shadow-3"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 border-b border-line-1 px-4 py-3">
          <Search size={18} className="shrink-0 text-text-3" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-text-1 typo-body-normal placeholder:text-text-4 outline-none"
            placeholder="검색 또는 이동..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd className="shrink-0 rounded-2 border border-line-2 bg-bg-3 px-1.5 py-0.5 typo-label-normal text-text-4">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[360px] overflow-y-auto p-2">
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
                      onSelect={() => handleSelect(item)}
                      onMouseEnter={() => setActiveIndex(currentIndex)}
                    />
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center gap-4 border-t border-line-1 px-4 py-2">
          <span className="flex items-center gap-1 typo-label-normal text-text-4">
            <kbd className="rounded-1 border border-line-2 bg-bg-3 px-1 py-0.5 text-[10px]">↑↓</kbd>
            이동
          </span>
          <span className="flex items-center gap-1 typo-label-normal text-text-4">
            <kbd className="rounded-1 border border-line-2 bg-bg-3 px-1 py-0.5 text-[10px]">↵</kbd>
            선택
          </span>
          <span className="flex items-center gap-1 typo-label-normal text-text-4">
            <kbd className="rounded-1 border border-line-2 bg-bg-3 px-1 py-0.5 text-[10px]">ESC</kbd>
            닫기
          </span>
          <span className="flex items-center gap-1 typo-label-normal text-text-4 ml-auto">
            <kbd className="rounded-1 border border-line-2 bg-bg-3 px-1 py-0.5 text-[10px]">&gt;</kbd>
            액션 모드
          </span>
        </div>
      </div>
    </>,
    document.body,
  );
};
