'use client';

import React, { useCallback, useEffect, useId, useState } from 'react';

import { useTranslations } from 'next-intl';

import { TestCaseCard, TestCaseCardType, duplicateTestCase } from '@/entities/test-case';
import {
  translateCaseErrors,
  translateCaseMessage,
} from '@/entities/test-case/lib/translate-message';
import { testCaseQueryKeys } from '@/features/cases-list';
import { arrayMove, useReorderCase } from '@/features/reorder';
import { TESTCASE_EVENTS, track } from '@/shared/lib/analytics';
import { TestTable } from '@/widgets';
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@testea/util';
import { toast } from 'sonner';

import { QuickCreateRow } from './quick-create-row';
import { SortableTestCaseRow } from './sortable-test-case-row';

interface CaseListSectionProps {
  projectId: string;
  slug: string;
  items: TestCaseCardType[];
  sortOption: string;
  selectedSuiteId: string;
  isFetching: boolean;
  hasData: boolean;
  debouncedSearch: string;
  pagination: {
    page: number;
    totalPages: number;
    totalItems: number;
  } | null;
  queryParams: Record<string, unknown>;
  onPageChange: (page: number) => void;
  onResetFilters: () => void;
  onSelectCase: (id: string) => void;
}

export const CaseListSection = ({
  projectId,
  slug,
  items,
  sortOption,
  selectedSuiteId,
  isFetching,
  hasData,
  debouncedSearch,
  pagination,
  queryParams,
  onPageChange,
  onResetFilters,
  onSelectCase,
}: CaseListSectionProps) => {
  const queryClient = useQueryClient();
  const t = useTranslations('cases');
  const isCustomSort = sortOption === 'custom';

  // D&D
  // DndContext 에 안정적인 id 를 주지 않으면 dnd-kit 가 내부 카운터로 접근성 id(DndDescribedBy-N)를
  // 생성해 SSR/CSR 값이 어긋나며 hydration 불일치가 난다. useId 로 서버·클라이언트 동일 id 를 보장한다.
  const dndId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );
  const reorderMutation = useReorderCase(projectId, queryParams);
  const [localItems, setLocalItems] = useState<TestCaseCardType[] | null>(null);

  // 서버 데이터(items)가 갱신되면 드래그 정렬용 로컬 오버라이드를 비워 서버 순서로 되돌린다
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 외부(서버) 데이터 변경에 로컬 드래그 오버라이드를 동기화. items 참조가 바뀔 때만 1회 실행
    setLocalItems(null);
  }, [items]);

  const displayItems = localItems ?? items;

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const currentItems = localItems ?? items;
      const oldIndex = currentItems.findIndex((item) => item.id === active.id);
      const newIndex = currentItems.findIndex((item) => item.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(currentItems, oldIndex, newIndex);
      setLocalItems(reordered);

      const beforeItem = newIndex > 0 ? reordered[newIndex - 1] : null;
      const afterItem = newIndex < reordered.length - 1 ? reordered[newIndex + 1] : null;

      reorderMutation.mutate({
        id: active.id as string,
        beforeOrder: beforeItem?.sortOrder ?? null,
        afterOrder: afterItem?.sortOrder ?? null,
        orderedIds: reordered.map((item) => item.id),
        projectId,
        scopeId: selectedSuiteId !== 'all' ? selectedSuiteId : projectId,
      });
    },
    [localItems, items, reorderMutation, projectId, selectedSuiteId]
  );

  // 복제
  const duplicateMutation = useMutation({
    mutationFn: (testCaseId: string) => duplicateTestCase(testCaseId),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(translateCaseMessage(t, 'CASE_DUPLICATED'));
        queryClient.invalidateQueries({ queryKey: testCaseQueryKeys.list(projectId) });
        queryClient.invalidateQueries({ queryKey: ['testSuites', projectId] });
      } else {
        const msg = Object.values(result.errors ?? {})
          .flat()
          .join(', ');
        toast.error(translateCaseErrors(t, msg) || t('ui.duplicateFailedFallback'));
      }
    },
  });

  const handleDuplicate = useCallback(
    (testCaseId: string) => {
      duplicateMutation.mutate(testCaseId);
    },
    [duplicateMutation]
  );

  const isEmpty = items.length === 0 && pagination && pagination.totalItems === 0;

  return (
    <div className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-6 lg:px-10">
      <section
        aria-label={t('ui.listAriaLabel')}
        aria-busy={isFetching && hasData ? true : undefined}
        className={cn(
          'rounded-3 border-line-2 bg-bg-2 shadow-1 border transition-opacity',
          isFetching && hasData ? 'opacity-60' : 'opacity-100'
        )}
      >
        <QuickCreateRow projectId={projectId} selectedSuiteId={selectedSuiteId} />

        {isEmpty ? (
          <div role="status" className="flex flex-col items-center justify-center gap-2 py-12">
            <p className="typo-body2-normal text-text-3">
              {debouncedSearch || selectedSuiteId !== 'all' ? t('ui.noResults') : t('ui.noCases')}
            </p>
            {(debouncedSearch || selectedSuiteId !== 'all') && (
              <button
                onClick={onResetFilters}
                className="typo-body2-normal text-primary hover:underline"
              >
                {t('ui.resetFilters')}
              </button>
            )}
          </div>
        ) : (
          <DndContext
            id={dndId}
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={displayItems.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="divide-line-2 divide-y">
                {displayItems.map((item) => (
                  <SortableTestCaseRow
                    key={item.isOptimistic ? item.id : item.caseKey}
                    id={item.id}
                    disabled={!isCustomSort || item.isOptimistic}
                  >
                    <div
                      role="button"
                      tabIndex={item.isOptimistic ? -1 : 0}
                      aria-label={t('ui.rowAriaLabel', {
                        caseKey: item.caseKey,
                        title: item.title,
                      })}
                      className={cn(
                        'group hover:bg-bg-3 flex cursor-pointer items-center overflow-hidden px-4 py-3 transition-colors',
                        'focus-visible:ring-primary focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset',
                        item.isOptimistic && 'pointer-events-none animate-pulse opacity-50'
                      )}
                      onClick={(e) => {
                        // 내부 인터랙티브 자식(액션 버튼 등) 클릭은 부모로 위임하지 않는다.
                        // currentTarget 비교는 자식 텍스트(div / span) 클릭까지 전부 차단해서
                        // 행 본문 클릭으로 케이스 진입이 안 되는 회귀가 생긴다.
                        // 인터랙티브 요소(button / a / input / select / textarea)만 가드한다.
                        if ((e.target as HTMLElement).closest('button, a, input, select, textarea'))
                          return;
                        track(TESTCASE_EVENTS.ITEM_CLICK, { case_id: item.id });
                        onSelectCase(item.id);
                      }}
                      onKeyDown={(e) => {
                        // 내부 인터랙티브 자식에 포커스된 상태의 Enter/Space 가
                        // 부모로 버블링돼 행 선택이 동시에 일어나지 않도록 가드한다.
                        if ((e.target as HTMLElement).closest('button, a, input, select, textarea'))
                          return;
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          track(TESTCASE_EVENTS.ITEM_CLICK, { case_id: item.id });
                          onSelectCase(item.id);
                        }
                      }}
                    >
                      <TestCaseCard testCase={item} onDuplicate={handleDuplicate} />
                    </div>
                  </SortableTestCaseRow>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {pagination && (
          <TestTable.Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            onPageChange={onPageChange}
          />
        )}
      </section>
    </div>
  );
};
