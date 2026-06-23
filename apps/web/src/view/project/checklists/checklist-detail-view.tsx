'use client';

import React, { useCallback, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { checklistByIdQueryOptions, checklistQueryKeys } from '@/entities/checklist';
import type { ChecklistItem } from '@/entities/checklist';
import {
  addChecklistItem,
  convertChecklistToTestCases,
  deleteChecklistItem,
  reorderChecklistItems,
  toggleChecklistItem,
} from '@/entities/checklist/api/server-actions';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MainContainer } from '@testea/ui';
import { Skeleton } from '@testea/ui';
import { cn } from '@testea/util';
import {
  ArrowLeft,
  ArrowRightLeft,
  Check,
  CheckSquare,
  Plus,
  RotateCcw,
  Square,
  Trash2,
  X,
} from 'lucide-react';
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

  // --- 체크 토글 (낙관적 업데이트) ---
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

  // --- 항목 추가 ---
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

  // --- 항목 삭제 ---
  const deleteMutation = useMutation({
    mutationFn: deleteChecklistItem,
    onSuccess: () => invalidate(),
  });

  // --- TC 변환 ---
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

  // --- 모두 초기화 ---
  const resetMutation = useMutation({
    mutationFn: async () => {
      if (!checklist) return;
      const checkedItems = checklist.items.filter((i) => i.isChecked);
      await Promise.all(checkedItems.map((i) => toggleChecklistItem(i.id, false)));
    },
    onSuccess: () => {
      toast.success('모든 항목이 초기화되었습니다.');
      invalidate();
    },
  });

  const items = checklist?.items ?? [];
  const totalItems = items.length;
  const checkedItems = items.filter((i) => i.isChecked).length;
  const percent = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;
  const isCompleted = totalItems > 0 && checkedItems === totalItems;

  const startedAt = checklist?.startedAt;
  const completedAt = checklist?.completedAt;
  const elapsedTime = useMemo(() => {
    if (!startedAt) return null;
    const end = completedAt ? new Date(completedAt) : new Date();
    const start = new Date(startedAt);
    const diffMs = end.getTime() - start.getTime();
    const mins = Math.floor(diffMs / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);
    if (mins > 0) return `${mins}분 ${secs}초`;
    return `${secs}초`;
  }, [startedAt, completedAt]);

  if (isLoading) {
    return (
      <MainContainer className="mx-auto w-full max-w-[800px] flex-1 px-10 py-8">
        <Skeleton className="mb-6 h-8 w-64" />
        <Skeleton className="mb-4 h-4 w-full" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="rounded-2 mb-2 h-12 w-full" />
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
    <MainContainer className="mx-auto w-full max-w-[800px] flex-1 overflow-y-auto px-10 py-8">
      {/* 헤더 */}
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push(`/projects/${slug}/checklists`)}
          className="text-text-3 hover:text-text-1 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="typo-title-heading text-text-1 flex-1">{checklist.title}</h1>
        <button
          type="button"
          onClick={() => setShowConvert(!showConvert)}
          className="typo-body2-normal text-text-3 hover:text-primary rounded-2 border-line-2 hover:border-primary/30 flex items-center gap-1.5 border px-3 py-1.5 transition-colors"
        >
          <ArrowRightLeft className="h-3.5 w-3.5" />
          <span>TC로 변환</span>
        </button>
      </div>

      {/* 프로그레스 바 */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="typo-body2-heading text-text-2">
            {checkedItems}/{totalItems} 완료
          </span>
          <span className="typo-body2-normal text-text-3">
            {percent}%{elapsedTime && ` · ${elapsedTime}`}
          </span>
        </div>
        <div className="bg-bg-4 h-3 overflow-hidden rounded-full">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              isCompleted ? 'bg-green-500' : 'bg-primary'
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* 완료 배너 */}
      {isCompleted && (
        <div className="rounded-3 mb-6 flex items-center justify-between border border-green-500/20 bg-green-500/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-green-500/20 p-2">
              <Check className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="typo-body1-heading text-green-400">체크리스트 완료!</p>
              {elapsedTime && (
                <p className="typo-label-normal text-green-400/70">소요 시간: {elapsedTime}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => resetMutation.mutate()}
            className="typo-body2-normal text-text-3 hover:text-text-1 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            모두 초기화
          </button>
        </div>
      )}

      {/* TC 변환 모드 안내 */}
      {showConvert && (
        <div className="rounded-3 bg-primary/5 border-primary/20 mb-4 flex items-center justify-between border px-5 py-3">
          <p className="typo-body2-normal text-text-2">
            변환할 항목을 선택하세요 ({selectedForConvert.size}개 선택됨)
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setShowConvert(false);
                setSelectedForConvert(new Set());
              }}
              className="typo-body2-normal text-text-3 hover:text-text-1 px-2 py-1"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => convertMutation.mutate()}
              disabled={selectedForConvert.size === 0 || convertMutation.isPending}
              className="typo-body2-heading bg-primary rounded-2 hover:bg-primary/90 px-3 py-1 text-white transition-colors disabled:opacity-50"
            >
              변환
            </button>
          </div>
        </div>
      )}

      {/* 항목 리스트 */}
      <div className="flex flex-col gap-1">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              'group rounded-2 flex items-center gap-3 px-4 py-3 transition-colors',
              item.isChecked ? 'bg-green-500/5' : 'hover:bg-bg-3'
            )}
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
                className="shrink-0"
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
                className="shrink-0"
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
                'typo-body2-normal flex-1',
                item.isChecked ? 'text-text-4 line-through' : 'text-text-1'
              )}
            >
              {item.content}
            </span>

            {!showConvert && (
              <button
                type="button"
                onClick={() => deleteMutation.mutate(item.id)}
                className="text-text-4 opacity-0 transition-all group-hover:opacity-100 hover:text-red-400"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* 항목 추가 */}
      {!showConvert && (
        <div className="mt-2 flex items-center gap-3 px-4 py-2">
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
            className="typo-body2-normal text-text-1 placeholder:text-text-4 flex-1 bg-transparent focus:outline-none"
          />
        </div>
      )}

      {/* 하단 초기화 버튼 (미완료 시) */}
      {!isCompleted && checkedItems > 0 && (
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => resetMutation.mutate()}
            className="typo-body2-normal text-text-4 hover:text-text-2 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            모두 초기화
          </button>
        </div>
      )}
    </MainContainer>
  );
};
