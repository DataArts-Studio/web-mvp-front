'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { projectIdQueryOptions } from '@/entities/project';
import { checklistsQueryOptions, checklistQueryKeys } from '@/entities/checklist';
import type { ChecklistWithProgress } from '@/entities/checklist';
import { createChecklist, archiveChecklist } from '@/entities/checklist/api/server-actions';
import { MainContainer } from '@testea/ui';
import { Skeleton, ProjectErrorFallback } from '@testea/ui';
import { ActionToolbar } from '@/widgets';
import { useDisclosure } from '@testea/lib';
import { toast } from 'sonner';
import { CheckSquare, Plus, Trash2 } from 'lucide-react';
import { cn } from '@testea/util';

export const ChecklistsView = () => {
  const params = useParams();
  const slug = params.slug as string;
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [searchQuery, setSearchQuery] = useState('');

  const { data: projectIdData, isLoading: isLoadingProject } = useQuery(projectIdQueryOptions(slug));
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

  // --- 인라인 생성 ---
  const [newTitle, setNewTitle] = useState('');
  const [newItems, setNewItems] = useState<string[]>(['']);

  const createMutation = useMutation({
    mutationFn: (input: { projectId: string; title: string; items: { content: string }[] }) =>
      createChecklist(input),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('체크리스트가 생성되었습니다.');
        if (projectId) queryClient.invalidateQueries({ queryKey: checklistQueryKeys.list(projectId) });
        setNewTitle('');
        setNewItems(['']);
        onClose();
      } else {
        const msg = Object.values(result.errors ?? {}).flat().join(', ');
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
    [newItems],
  );

  const deleteMutation = useMutation({
    mutationFn: archiveChecklist,
    onSuccess: (result) => {
      if (result.success) {
        toast.success('체크리스트가 삭제되었습니다.');
        if (projectId) queryClient.invalidateQueries({ queryKey: checklistQueryKeys.list(projectId) });
      }
    },
  });

  const getStatusBadge = (c: ChecklistWithProgress) => {
    if (c.status === 'completed') return { label: '완료', cls: 'bg-green-500/15 text-green-400' };
    if (c.status === 'in_progress') return { label: '진행 중', cls: 'bg-yellow-500/15 text-yellow-400' };
    return { label: '대기', cls: 'bg-text-4/15 text-text-3' };
  };

  if (isLoadingProject || isLoadingChecklists) {
    return (
      <MainContainer className="mx-auto grid min-h-screen w-full max-w-[1200px] flex-1 grid-cols-6 content-start gap-x-5 gap-y-8 px-10 py-8">
        <header className="col-span-6 flex flex-col gap-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-96" />
        </header>
        <div className="col-span-6 flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-3" />
          ))}
        </div>
      </MainContainer>
    );
  }

  if (!projectIdData?.success) return <ProjectErrorFallback />;

  return (
    <MainContainer className="mx-auto grid h-screen w-full max-w-[1200px] flex-1 grid-cols-6 grid-rows-[auto_auto_1fr] gap-x-5 gap-y-4 overflow-hidden px-10 py-8">
      <header className="col-span-6 flex flex-col gap-1">
        <h1 className="typo-title-heading">체크리스트</h1>
        <p className="typo-body1-normal text-text-3">
          배포 전 빠르게 확인할 항목을 체크리스트로 관리하세요.
        </p>
      </header>

      <ActionToolbar.Root ariaLabel="체크리스트 컨트롤">
        <ActionToolbar.Group>
          <ActionToolbar.Search
            placeholder="체크리스트 제목으로 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </ActionToolbar.Group>
        <ActionToolbar.Action size="small" type="button" variant="solid" onClick={onOpen}>
          <Plus className="h-4 w-4" />
          <span className="leading-none">새 체크리스트</span>
        </ActionToolbar.Action>
      </ActionToolbar.Root>

      <section className="col-span-6 flex min-h-0 flex-col">
        <div className="flex-1 overflow-y-auto flex flex-col gap-3">
          {/* 생성 폼 */}
          {isOpen && (
            <div className="rounded-3 border border-primary/30 bg-bg-2 p-5 flex flex-col gap-4">
              <input
                type="text"
                placeholder="체크리스트 제목"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="typo-body1-heading bg-transparent text-text-1 placeholder:text-text-4 focus:outline-none border-b border-line-2 pb-2"
                autoFocus
              />
              <div className="flex flex-col gap-1">
                <p className="typo-label-normal text-text-3 mb-1">항목 (Enter로 추가)</p>
                {newItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-text-4 shrink-0" />
                    <input
                      data-checklist-input
                      type="text"
                      placeholder={`항목 ${idx + 1}`}
                      value={item}
                      onChange={(e) => {
                        setNewItems((prev) => prev.map((v, i) => (i === idx ? e.target.value : v)));
                      }}
                      onKeyDown={(e) => handleItemKeyDown(idx, e)}
                      className="typo-body2-normal bg-transparent text-text-1 placeholder:text-text-4 focus:outline-none flex-1 py-1"
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={onClose} className="typo-body2-normal text-text-3 hover:text-text-1 px-3 py-1.5 transition-colors">
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                  className="typo-body2-heading bg-primary text-white rounded-2 px-4 py-1.5 hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  생성
                </button>
              </div>
            </div>
          )}

          {/* 리스트 */}
          {checklists.length === 0 && !isOpen ? (
            <div className="rounded-3 border-line-2 bg-bg-2/50 flex h-full flex-col items-center justify-center gap-4 border-2 border-dashed py-20 text-center">
              <div className="bg-bg-3 text-text-3 flex h-12 w-12 items-center justify-center rounded-full">
                <CheckSquare className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col gap-1">
                <p className="typo-h3-heading text-text-1">등록된 체크리스트가 없습니다.</p>
                <p className="typo-body2-normal text-text-3">
                  새 체크리스트를 만들어 빠르게 테스트를 시작하세요.
                </p>
              </div>
            </div>
          ) : (
            checklists.map((c) => {
              const badge = getStatusBadge(c);
              const percent = c.totalItems > 0 ? Math.round((c.checkedItems / c.totalItems) * 100) : 0;
              return (
                <Link key={c.id} href={`/projects/${slug}/checklists/${c.id}`}>
                  <div className="group rounded-3 border border-line-2 bg-bg-2 px-5 py-4 flex items-center gap-5 transition-colors hover:bg-bg-3">
                    {/* 좌: 제목 + 상태 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1">
                        <h3 className="typo-body1-heading text-text-1 truncate">{c.title}</h3>
                        <span className={cn('typo-label-normal rounded-full px-2 py-0.5', badge.cls)}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="typo-label-normal text-text-3">
                        {c.checkedItems}/{c.totalItems} 항목 완료
                      </p>
                    </div>

                    {/* 중: 프로그레스 바 */}
                    <div className="w-32 shrink-0">
                      <div className="h-2 rounded-full bg-bg-4 overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            percent === 100 ? 'bg-green-500' : 'bg-primary',
                          )}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <p className="typo-label-normal text-text-4 text-right mt-0.5">{percent}%</p>
                    </div>

                    {/* 우: 삭제 */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteMutation.mutate(c.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-text-4 hover:text-red-400 transition-all p-1"
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
    </MainContainer>
  );
};
