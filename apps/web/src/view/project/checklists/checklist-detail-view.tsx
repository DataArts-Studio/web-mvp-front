'use client';

import React, { useCallback, useState } from 'react';

import { useRouter } from 'next/navigation';

import { checklistByIdQueryOptions, checklistQueryKeys } from '@/entities/checklist';
import type { ChecklistItem } from '@/entities/checklist';
import {
  addChecklistItem,
  convertChecklistToTestCases,
  deleteChecklistItem,
  toggleChecklistItem,
} from '@/entities/checklist/api/server-actions';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MainContainer, Skeleton } from '@testea/ui';
import { cn } from '@testea/util';
import { ArrowLeft, ArrowRightLeft, CheckSquare, Plus, RotateCcw, Square, X } from 'lucide-react';
import { toast } from 'sonner';

type Props = {
  checklistId: string;
  projectId: string;
  slug: string;
};

export const ChecklistDetailView = ({ checklistId, projectId, slug }: Props) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [newItemContent, setNewItemContent] = useState('');
  const [showConvert, setShowConvert] = useState(false);
  const [selectedForConvert, setSelectedForConvert] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery(checklistByIdQueryOptions(checklistId));
  const checklist = data?.success ? data.data : null;

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: checklistQueryKeys.detail(checklistId) });
    queryClient.invalidateQueries({ queryKey: checklistQueryKeys.list(projectId) });
  }, [queryClient, checklistId, projectId]);

  const toggleMutation = useMutation({
    mutationFn: ({ itemId, isChecked }: { itemId: string; isChecked: boolean }) =>
      toggleChecklistItem(itemId, isChecked),
    onMutate: async ({ itemId, isChecked }) => {
      await queryClient.cancelQueries({ queryKey: checklistQueryKeys.detail(checklistId) });
      const prev = queryClient.getQueryData(checklistByIdQueryOptions(checklistId).queryKey);
      queryClient.setQueryData(
        checklistByIdQueryOptions(checklistId).queryKey,
        (old: typeof prev) => {
          if (!old?.success) return old;
          return {
            ...old,
            data: {
              ...old.data,
              items: old.data.items.map((item: ChecklistItem) =>
                item.id === itemId
                  ? { ...item, isChecked, checkedAt: isChecked ? new Date().toISOString() : null }
                  : item
              ),
            },
          };
        }
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(checklistByIdQueryOptions(checklistId).queryKey, ctx.prev);
      }
      toast.error('상태 변경에 실패했습니다.');
    },
    onSettled: () => invalidate(),
  });

  const addMutation = useMutation({
    mutationFn: (content: string) => addChecklistItem({ checklistId, content }),
    onSuccess: (result) => {
      if (result.success) {
        setNewItemContent('');
        invalidate();
      } else {
        toast.error('항목 추가에 실패했습니다.');
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteChecklistItem,
    onSuccess: () => invalidate(),
  });

  const convertMutation = useMutation({
    mutationFn: () =>
      convertChecklistToTestCases(checklistId, Array.from(selectedForConvert), projectId),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`${result.data.count}개의 테스트 케이스로 변환되었습니다.`);
        setShowConvert(false);
        setSelectedForConvert(new Set());
      } else {
        const msg = Object.values(result.errors ?? {})
          .flat()
          .join(', ');
        toast.error(msg || '변환에 실패했습니다.');
      }
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      if (!checklist) return;
      const checked = checklist.items.filter((i) => i.isChecked);
      await Promise.all(checked.map((i) => toggleChecklistItem(i.id, false)));
    },
    onSuccess: () => {
      toast.success('모든 항목이 초기화되었습니다.');
      invalidate();
    },
  });

  const items = checklist?.items ?? [];
  const totalItems = items.length;
  const checkedItems = items.filter((i) => i.isChecked).length;
  const isCompleted = totalItems > 0 && checkedItems === totalItems;

  const elapsedTime = (() => {
    if (!checklist?.startedAt) return null;
    const end = checklist.completedAt ? new Date(checklist.completedAt) : new Date();
    const start = new Date(checklist.startedAt);
    const diffMs = end.getTime() - start.getTime();
    const mins = Math.floor(diffMs / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);
    if (mins > 0) return `${mins}분 ${secs}초`;
    return `${secs}초`;
  })();

  if (isLoading) {
    return (
      <MainContainer className="mx-auto w-full max-w-[1040px] flex-1 px-4 py-4">
        <Skeleton className="mb-4 h-8 w-64" />
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="mb-2 h-11 w-full rounded-none" />
        ))}
      </MainContainer>
    );
  }

  if (!checklist) {
    return (
      <MainContainer className="mx-auto flex flex-1 items-center justify-center">
        <p className="text-text-3">체크리스트를 찾을 수 없습니다.</p>
      </MainContainer>
    );
  }

  return (
    <MainContainer className="mx-auto w-full max-w-[1040px] flex-1 overflow-y-auto px-4 py-4">
      <header className="border-line-3/40 mb-3 flex items-center gap-3 border-b pb-3">
        <button
          type="button"
          onClick={() => router.push(`/projects/${slug}/checklists`)}
          className="text-text-3 hover:text-text-1 transition-colors"
          aria-label="체크리스트 목록으로 이동"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-text-1 truncate text-xl leading-7 font-semibold">
            {checklist.title}
          </h1>
          <p className="text-text-4 mt-0.5 text-sm">
            {checkedItems}/{totalItems} 완료{elapsedTime && ` · ${elapsedTime}`}
            {isCompleted && ' · 완료'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowConvert(!showConvert)}
          className="text-text-3 hover:text-primary hover:border-primary/30 border-line-3/40 flex h-8 items-center gap-1.5 border px-3 text-sm transition-colors"
        >
          <ArrowRightLeft className="h-3.5 w-3.5" />
          TC로 변환
        </button>
      </header>

      {showConvert && (
        <div className="border-line-3/40 mb-3 flex items-center justify-between gap-3 border-b pb-3">
          <p className="text-text-2 text-sm">
            변환할 항목 선택 <span className="text-text-4">({selectedForConvert.size}개)</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setShowConvert(false);
                setSelectedForConvert(new Set());
              }}
              className="text-text-3 hover:text-text-1 h-8 px-2 text-sm transition-colors"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => convertMutation.mutate()}
              disabled={selectedForConvert.size === 0 || convertMutation.isPending}
              className="border-primary bg-primary hover:bg-primary/90 h-8 border px-3 text-sm font-medium text-white transition-colors disabled:opacity-50"
            >
              변환
            </button>
          </div>
        </div>
      )}

      <section className="border-line-3/40 border-t">
        <div className="text-text-4 border-line-3/40 grid grid-cols-[36px_minmax(0,1fr)_36px] border-b px-3 py-2 text-xs font-medium">
          <span />
          <span>항목</span>
          <span />
        </div>

        {items.map((item) => (
          <div
            key={item.id}
            className="group hover:bg-bg-2 border-line-3/40 grid grid-cols-[36px_minmax(0,1fr)_36px] items-center border-b px-3 py-2.5 last:border-b-0"
          >
            {showConvert ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedForConvert((prev) => {
                    const next = new Set(prev);
                    if (next.has(item.id)) next.delete(item.id);
                    else next.add(item.id);
                    return next;
                  });
                }}
                className="justify-self-start"
                aria-label="변환 항목 선택"
              >
                {selectedForConvert.has(item.id) ? (
                  <CheckSquare className="text-primary h-5 w-5" />
                ) : (
                  <Square className="text-text-4 h-5 w-5" />
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  toggleMutation.mutate({ itemId: item.id, isChecked: !item.isChecked })
                }
                className="justify-self-start"
                aria-label="항목 완료 상태 변경"
              >
                {item.isChecked ? (
                  <CheckSquare className="h-5 w-5 text-green-500" />
                ) : (
                  <Square className="text-text-4 hover:text-text-2 h-5 w-5 transition-colors" />
                )}
              </button>
            )}

            <span
              className={cn(
                'min-w-0 text-sm',
                item.isChecked ? 'text-text-4 line-through' : 'text-text-1'
              )}
            >
              {item.content}
            </span>

            {!showConvert && (
              <button
                type="button"
                onClick={() => deleteMutation.mutate(item.id)}
                className="text-text-4 justify-self-end opacity-0 transition-all group-hover:opacity-100 hover:text-red-400"
                aria-label="항목 삭제"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </section>

      {!showConvert && (
        <div className="border-line-3/40 mt-3 flex items-center gap-2 border-b py-2">
          <Plus className="text-text-4 h-4 w-4 shrink-0" />
          <input
            type="text"
            placeholder="새 항목 추가 (Enter)"
            value={newItemContent}
            onChange={(e) => setNewItemContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newItemContent.trim()) {
                e.preventDefault();
                addMutation.mutate(newItemContent.trim());
              }
            }}
            className="text-text-1 placeholder:text-text-4 min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </div>
      )}

      {!isCompleted && checkedItems > 0 && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => resetMutation.mutate()}
            className="text-text-4 hover:text-text-2 flex items-center gap-1.5 text-sm transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            모두 초기화
          </button>
        </div>
      )}
    </MainContainer>
  );
};
