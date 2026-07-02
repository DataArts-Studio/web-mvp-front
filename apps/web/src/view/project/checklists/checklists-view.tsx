'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { checklistQueryKeys, checklistsQueryOptions } from '@/entities/checklist';
import type { ChecklistWithProgress } from '@/entities/checklist';
import { archiveChecklist, createChecklist } from '@/entities/checklist/api/server-actions';
import { projectIdQueryOptions } from '@/entities/project';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDisclosure } from '@testea/lib';
import { MainContainer, ProjectErrorFallback, Skeleton } from '@testea/ui';
import { cn } from '@testea/util';
import { CheckSquare, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export const ChecklistsView = () => {
  const params = useParams();
  const slug = params.slug as string;
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [searchQuery, setSearchQuery] = useState('');

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 마운트 후 hydration 완료 표시로 SSR↔CSR 미스매치 방지. mount-once 1회성이라 cascading render 비용 없음
    setHydrated(true);
  }, []);

  const { data: projectIdData, isLoading: isLoadingProject } = useQuery(
    projectIdQueryOptions(slug)
  );
  const projectId = projectIdData?.success ? projectIdData.data.id : undefined;

  const { data: checklistsData, isLoading: isLoadingChecklists } = useQuery({
    ...checklistsQueryOptions(projectId!),
    enabled: !!projectId,
  });

  const checklists = useMemo(() => {
    if (!checklistsData?.success) return [];
    const items = checklistsData.data;
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter((c) => c.title.toLowerCase().includes(q));
  }, [checklistsData, searchQuery]);

  const [newTitle, setNewTitle] = useState('');
  const [newItems, setNewItems] = useState<string[]>(['']);

  const createMutation = useMutation({
    mutationFn: (input: { projectId: string; title: string; items: { content: string }[] }) =>
      createChecklist(input),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('체크리스트가 생성되었습니다.');
        if (projectId)
          queryClient.invalidateQueries({ queryKey: checklistQueryKeys.list(projectId) });
        setNewTitle('');
        setNewItems(['']);
        onClose();
      } else {
        const msg = Object.values(result.errors ?? {})
          .flat()
          .join(', ');
        toast.error(msg || '생성에 실패했습니다.');
      }
    },
  });

  const handleCreate = useCallback(() => {
    if (!projectId || !newTitle.trim()) return;
    const validItems = newItems.filter((s) => s.trim()).map((s) => ({ content: s.trim() }));
    if (validItems.length === 0) {
      toast.error('최소 1개 항목이 필요합니다.');
      return;
    }
    createMutation.mutate({ projectId, title: newTitle.trim(), items: validItems });
  }, [projectId, newTitle, newItems, createMutation]);

  const handleItemKeyDown = useCallback(
    (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        setNewItems((prev) => {
          const next = [...prev];
          next.splice(idx + 1, 0, '');
          return next;
        });
        setTimeout(() => {
          const inputs = document.querySelectorAll<HTMLInputElement>('[data-checklist-input]');
          inputs[idx + 1]?.focus();
        }, 0);
      }
      if (e.key === 'Backspace' && newItems[idx] === '' && newItems.length > 1) {
        e.preventDefault();
        setNewItems((prev) => prev.filter((_, i) => i !== idx));
        setTimeout(() => {
          const inputs = document.querySelectorAll<HTMLInputElement>('[data-checklist-input]');
          inputs[Math.max(0, idx - 1)]?.focus();
        }, 0);
      }
    },
    [newItems]
  );

  const deleteMutation = useMutation({
    mutationFn: archiveChecklist,
    onSuccess: (result) => {
      if (result.success) {
        toast.success('체크리스트가 삭제되었습니다.');
        if (projectId)
          queryClient.invalidateQueries({ queryKey: checklistQueryKeys.list(projectId) });
      }
    },
  });

  const getStatusBadge = (c: ChecklistWithProgress) => {
    if (c.status === 'completed') return { label: '완료', cls: 'text-green-500' };
    if (c.status === 'in_progress') return { label: '진행 중', cls: 'text-yellow-500' };
    return { label: '대기', cls: 'text-text-3' };
  };

  if (!hydrated || isLoadingProject || isLoadingChecklists) {
    return (
      <MainContainer className="mx-auto flex min-h-screen w-full max-w-[1040px] flex-1 flex-col gap-3 px-4 py-4">
        <header className="flex items-center justify-between border-b pb-3">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-44" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-8 w-28" />
        </header>
        <div className="flex flex-col border">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-none border-b" />
          ))}
        </div>
      </MainContainer>
    );
  }

  if (!projectIdData?.success) return <ProjectErrorFallback />;

  return (
    <MainContainer className="h-screen w-full flex-1 overflow-hidden px-4 py-4">
      <div className="mx-auto flex h-full w-full max-w-[1040px] flex-col gap-3">
        <header className="border-line-3/70 flex shrink-0 items-center justify-between gap-4 border-b pb-3">
          <div className="flex min-w-0 items-baseline gap-2">
            <h1 className="text-text-1 text-xl leading-7 font-semibold">체크리스트</h1>
            <span className="text-text-4 text-sm">{checklists.length}개</span>
          </div>
        </header>

        <div className="flex shrink-0 items-center justify-between gap-3 pb-2">
          <label className="text-text-3 flex h-8 min-w-0 flex-1 items-center gap-2 text-sm">
            <Search className="h-4 w-4 shrink-0" />
            <input
              type="search"
              placeholder="체크리스트 제목으로 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-text-1 placeholder:text-text-4 h-full min-w-0 flex-1 bg-transparent outline-none"
            />
          </label>
          <button
            type="button"
            onClick={onOpen}
            className="text-text-2 hover:bg-bg-2 border-line-3/40 flex h-8 shrink-0 items-center gap-1.5 border px-3 text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />새 체크리스트
          </button>
        </div>

        {isOpen && (
          <section className="border-line-3/40 shrink-0 border-b pb-3">
            <div className="grid gap-x-4 gap-y-2 lg:grid-cols-[120px_minmax(0,1fr)_auto]">
              <label className="text-text-4 pt-1.5 text-xs font-medium">제목</label>
              <input
                type="text"
                placeholder="체크리스트 제목"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="text-text-1 placeholder:text-text-4 border-line-3/40 h-8 border-b bg-transparent text-sm outline-none"
                autoFocus
              />
              <div className="hidden lg:block" />

              <label className="text-text-4 pt-1.5 text-xs font-medium">항목</label>
              <div className="min-w-0">
                {newItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="border-line-3/40 flex items-center gap-2 border-b py-1.5"
                  >
                    <CheckSquare className="text-text-4 h-4 w-4 shrink-0" />
                    <input
                      data-checklist-input
                      type="text"
                      placeholder={`항목 ${idx + 1}`}
                      value={item}
                      onChange={(e) => {
                        setNewItems((prev) => prev.map((v, i) => (i === idx ? e.target.value : v)));
                      }}
                      onKeyDown={(e) => handleItemKeyDown(idx, e)}
                      className="text-text-1 placeholder:text-text-4 min-w-0 flex-1 bg-transparent text-sm outline-none"
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-2">
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                  className="border-primary bg-primary hover:bg-primary/90 h-8 border px-3 text-sm font-medium text-white transition-colors disabled:opacity-50"
                >
                  생성
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-text-3 hover:text-text-1 hover:bg-bg-2 border-line-3/40 h-8 border px-3 text-sm transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </section>
        )}

        <section className="border-line-3/40 flex min-h-0 flex-1 flex-col border-t">
          <div className="text-text-4 border-line-3/40 grid grid-cols-[minmax(0,1fr)_100px_120px_36px] border-b px-3 py-2 text-xs font-medium">
            <span>제목</span>
            <span>상태</span>
            <span className="text-right">진행</span>
            <span />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {checklists.length === 0 && !isOpen ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
                <div className="flex flex-col gap-1">
                  <p className="text-text-1 text-sm font-semibold">등록된 체크리스트가 없습니다.</p>
                  <p className="text-text-3 text-sm">새 체크리스트를 만들어 항목을 정리하세요.</p>
                </div>
              </div>
            ) : (
              checklists.map((c) => {
                const badge = getStatusBadge(c);
                return (
                  <Link key={c.id} href={`/projects/${slug}/checklists/${c.id}`}>
                    <div className="group hover:bg-bg-2 border-line-3/40 grid grid-cols-[minmax(0,1fr)_100px_120px_36px] items-center border-b px-3 py-2.5 transition-colors last:border-b-0">
                      <div className="min-w-0">
                        <h3 className="text-text-1 truncate text-sm font-medium">{c.title}</h3>
                        <p className="text-text-4 mt-0.5 text-xs">
                          {c.checkedItems}/{c.totalItems} 항목 완료
                        </p>
                      </div>

                      <span className={cn('text-sm font-medium', badge.cls)}>{badge.label}</span>

                      <div className="text-text-3 text-right text-sm">
                        {c.checkedItems}/{c.totalItems}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          deleteMutation.mutate(c.id);
                        }}
                        className="text-text-4 justify-self-end p-1 opacity-0 transition-all group-hover:opacity-100 hover:text-red-400"
                        aria-label="체크리스트 삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </section>
      </div>
    </MainContainer>
  );
};
