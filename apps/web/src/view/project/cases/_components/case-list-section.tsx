'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { TestCaseCard, TestCaseCardType, duplicateTestCase } from '@/entities/test-case';
import { testCaseQueryKeys } from '@/features/cases-list';
import { useReorderCase, arrayMove } from '@/features/reorder';
import { TestTable } from '@/widgets';
import { cn } from '@/shared/utils';
import { track, TESTCASE_EVENTS } from '@/shared/lib/analytics';

import { SortableTestCaseRow } from './sortable-test-case-row';
import { QuickCreateRow } from './quick-create-row';

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
  const isCustomSort = sortOption === 'custom';

  // D&D
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );
  const reorderMutation = useReorderCase(projectId, queryParams);
  const [localItems, setLocalItems] = useState<TestCaseCardType[] | null>(null);

  // 서버 데이터 변경 시 localItems 리셋
  useEffect(() => {
    setLocalItems(null);
  }, [items]);

  const displayItems = localItems ?? items;

  const handleDragEnd = useCallback((event: DragEndEvent) => {
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
  }, [localItems, items, reorderMutation, projectId, selectedSuiteId]);

  // 복제
  const duplicateMutation = useMutation({
    mutationFn: (testCaseId: string) => duplicateTestCase(testCaseId),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('테스트 케이스가 복제되었습니다.');
        queryClient.invalidateQueries({ queryKey: testCaseQueryKeys.list(projectId) });
        queryClient.invalidateQueries({ queryKey: ['testSuites', projectId] });
      } else {
        const msg = Object.values(result.errors ?? {}).flat().join(', ');
        toast.error(msg || '복제에 실패했습니다.');
      }
    },
  });

  const handleDuplicate = useCallback((testCaseId: string) => {
    duplicateMutation.mutate(testCaseId);
  }, [duplicateMutation]);

  const isEmpty = items.length === 0 && pagination && pagination.totalItems === 0;

  return (
    <div className="mx-auto w-full max-w-[1200px] flex-1 px-6 lg:px-10 py-6">
      <section className={cn(
        'rounded-3 border-line-2 bg-bg-2 shadow-1 border transition-opacity',
        isFetching && hasData ? 'opacity-60' : 'opacity-100',
      )}>
        <QuickCreateRow projectId={projectId} selectedSuiteId={selectedSuiteId} />

        {isEmpty ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12">
            <p className="typo-body2-normal text-text-3">
              {debouncedSearch || selectedSuiteId !== 'all' ? '검색 결과가 없습니다.' : '테스트 케이스가 없습니다.'}
            </p>
            {(debouncedSearch || selectedSuiteId !== 'all') && (
              <button onClick={onResetFilters} className="typo-body2-normal text-primary hover:underline">
                필터 초기화
              </button>
            )}
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={displayItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
              <div className="divide-y divide-line-2">
                {displayItems.map((item) => (
                  <SortableTestCaseRow key={item.isOptimistic ? item.id : item.caseKey} id={item.id} disabled={!isCustomSort || item.isOptimistic}>
                    <div
                      className={cn(
                        'group flex cursor-pointer items-center overflow-hidden px-4 py-3 transition-colors hover:bg-bg-3',
                        item.isOptimistic && 'opacity-50 pointer-events-none animate-pulse',
                      )}
                      onClick={() => {
                        track(TESTCASE_EVENTS.ITEM_CLICK, { case_id: item.id });
                        onSelectCase(item.id);
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
