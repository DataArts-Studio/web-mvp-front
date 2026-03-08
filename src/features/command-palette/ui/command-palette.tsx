'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useRouter, useParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useCommandPalette } from '../hooks/use-command-palette';
import { useCommandSearch } from '../hooks/use-command-search';
import { useRecentVisits } from '../hooks/use-recent-visits';
import { useCommandNavigation } from '../hooks/use-command-navigation';
import { getQuickActions } from '../model/actions';
import { CommandSearchInput } from './command-search-input';
import { CommandList } from './command-list';
import { CommandFooter } from './command-footer';
import { dashboardQueryKeys } from '@/features/dashboard';
import type { CommandItem as CommandItemType, CommandItemCategory } from '../model/types';
import { FileText, FolderOpen, Flag, Play } from 'lucide-react';

const RECENT_TYPE_ICONS: Record<string, typeof FileText> = {
  testCase: FileText,
  testSuite: FolderOpen,
  milestone: Flag,
  testRun: Play,
};

export const CommandPalette = () => {
  const { isOpen, close } = useCommandPalette();
  const [query, setQuery] = useState('');
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

  const { activeIndex, setActiveIndex, handleKeyDown } = useCommandNavigation({
    items: displayItems,
    query,
    isOpen,
    onSelect: handleSelect,
    onClose: close,
    listRef,
  });

  // 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || !isOpen) return null;

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
        <CommandSearchInput
          ref={inputRef}
          value={query}
          onChange={setQuery}
        />

        <CommandList
          ref={listRef}
          displayItems={displayItems}
          groupedItems={groupedItems}
          query={query}
          activeIndex={activeIndex}
          onSelect={handleSelect}
          onActiveIndexChange={setActiveIndex}
        />

        <CommandFooter />
      </div>
    </>,
    document.body,
  );
};
