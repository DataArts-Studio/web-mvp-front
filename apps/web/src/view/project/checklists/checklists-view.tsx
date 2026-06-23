'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { checklistQueryKeys, checklistsQueryOptions } from '@/entities/checklist';
import type { ChecklistWithProgress } from '@/entities/checklist';
import { archiveChecklist, createChecklist } from '@/entities/checklist/api/server-actions';
import { projectIdQueryOptions } from '@/entities/project';
import { ActionToolbar } from '@/widgets';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDisclosure } from '@testea/lib';
import { MainContainer } from '@testea/ui';
import { ProjectErrorFallback, Skeleton } from '@testea/ui';
import { cn } from '@testea/util';
import { CheckSquare, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export const ChecklistsView = () => {
  const params = useParams();
  const slug = params.slug as string;
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [searchQuery, setSearchQuery] = useState('');

  // 클라이언트 hydration 완료 전까지 서버와 동일 출력(스켈레톤) 보장 → SSR↔CSR 미스매치 방지
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

  // --- 인라인 생성 ---
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
    if (c.status === 'completed') return { label: '완료', cls: 'bg-green-500/15 text-green-400' };
    if (c.status === 'in_progress')
      return { label: '진행 중', cls: 'bg-yellow-500/15 text-yellow-400' };
    return { label: '대기', cls: 'bg-text-4/15 text-text-3' };
  };

  if (!hydrated || isLoadingProject || isLoadingChecklists) {
    return (
      <MainContainer className="mx-auto grid min-h-screen w-full max-w-[1200px] flex-1 grid-cols-6 content-start gap-x-5 gap-y-8 px-10 py-8">
        <header className="col-span-6 flex flex-col gap-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-96" />
        </header>
        <div className="col-span-6 flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="rounded-3 h-20 w-full" />
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
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
          {/* 생성 폼 */}
          {isOpen && (
            <div className="rounded-3 border-primary/30 bg-bg-2 flex flex-col gap-4 border p-5">
              <input
                type="text"
                placeholder="체크리스트 제목"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="typo-body1-heading text-text-1 placeholder:text-text-4 border-line-2 border-b bg-transparent pb-2 focus:outline-none"
                autoFocus
              />
              <div className="flex flex-col gap-1">
                <p className="typo-label-normal text-text-3 mb-1">항목 (Enter로 추가)</p>
                {newItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
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
                      className="typo-body2-normal text-text-1 placeholder:text-text-4 flex-1 bg-transparent py-1 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="typo-body2-normal text-text-3 hover:text-text-1 px-3 py-1.5 transition-colors"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                  className="typo-body2-heading bg-primary rounded-2 hover:bg-primary/90 px-4 py-1.5 text-white transition-colors disabled:opacity-50"
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
              const percent =
                c.totalItems > 0 ? Math.round((c.checkedItems / c.totalItems) * 100) : 0;
              return (
                <Link key={c.id} href={`/projects/${slug}/checklists/${c.id}`}>
                  <div className="group rounded-3 border-line-2 bg-bg-2 hover:bg-bg-3 flex items-center gap-5 border px-5 py-4 transition-colors">
                    {/* 좌: 제목 + 상태 */}
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2.5">
                        <h3 className="typo-body1-heading text-text-1 truncate">{c.title}</h3>
                        <span
                          className={cn('typo-label-normal rounded-full px-2 py-0.5', badge.cls)}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <p className="typo-label-normal text-text-3">
                        {c.checkedItems}/{c.totalItems} 항목 완료
                      </p>
                    </div>

                    {/* 중: 프로그레스 바 */}
                    <div className="w-32 shrink-0">
                      <div className="bg-bg-4 h-2 overflow-hidden rounded-full">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            percent === 100 ? 'bg-green-500' : 'bg-primary'
                          )}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <p className="typo-label-normal text-text-4 mt-0.5 text-right">{percent}%</p>
                    </div>

                    {/* 우: 삭제 */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteMutation.mutate(c.id);
                      }}
                      className="text-text-4 p-1 opacity-0 transition-all group-hover:opacity-100 hover:text-red-400"
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
