'use client';

import React, { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

import {
  useTrashItems,
  useRestoreItem,
  usePermanentDelete,
  useEmptyTrash,
} from '@/features/trash';
import type { TrashItem, TrashItemType } from '@/features/trash';
import { dashboardQueryOptions } from '@/features/dashboard';
import { Container, MainContainer, DSButton, LoadingSpinner } from '@/shared';
import { Dialog } from '@/shared/lib/primitives';
import { Aside } from '@/widgets';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  FileText,
  FolderOpen,
  Flag,
  Clock,
  Loader2,
  Search,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/shared/utils';

const TYPE_CONFIG: Record<
  TrashItemType,
  { label: string; icon: typeof FileText; color: string; bgColor: string }
> = {
  case: {
    label: '테스트 케이스',
    icon: FileText,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
  },
  suite: {
    label: '테스트 스위트',
    icon: FolderOpen,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
  },
  milestone: {
    label: '마일스톤',
    icon: Flag,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
  },
};

const FILTER_OPTIONS: { value: 'all' | TrashItemType; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'case', label: '테스트 케이스' },
  { value: 'suite', label: '테스트 스위트' },
  { value: 'milestone', label: '마일스톤' },
];

function formatDeletedDate(date: Date): string {
  const d = new Date(date);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
}

function DaysRemainingBadge({ days }: { days: number }) {
  const isUrgent = days <= 7;
  return (
    <span
      className={cn(
        'typo-label-normal inline-flex items-center gap-1 rounded-full px-2 py-0.5',
        isUrgent
          ? 'bg-red-500/10 text-red-400'
          : 'bg-bg-3 text-text-3',
      )}
    >
      <Clock className="h-3 w-3" />
      {days}일 남음
    </span>
  );
}

function TrashItemRow({
  item,
  onRestore,
  onDelete,
  isRestoring,
  isDeleting,
}: {
  item: TrashItem;
  onRestore: () => void;
  onDelete: () => void;
  isRestoring: boolean;
  isDeleting: boolean;
}) {
  const config = TYPE_CONFIG[item.type];
  const Icon = config.icon;
  const isPending = isRestoring || isDeleting;

  return (
    <div
      className={cn(
        'group border-line-2 grid grid-cols-12 items-center gap-4 border-b px-6 py-4 transition-colors',
        isPending ? 'opacity-50' : 'hover:bg-bg-3/50',
      )}
    >
      {/* Type icon + Title */}
      <div className="col-span-5 flex items-center gap-3 min-w-0">
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
            config.bgColor,
          )}
        >
          <Icon className={cn('h-4 w-4', config.color)} />
        </div>
        <div className="min-w-0">
          <p className="typo-body2-heading text-text-1 truncate">{item.title}</p>
          <p className={cn('typo-label-normal', config.color)}>{config.label}</p>
        </div>
      </div>

      {/* Deleted date */}
      <div className="col-span-2 text-center">
        <span className="typo-body2-normal text-text-3">
          {formatDeletedDate(item.deletedAt)}
        </span>
      </div>

      {/* Days remaining */}
      <div className="col-span-2 text-center">
        <DaysRemainingBadge days={item.daysRemaining} />
      </div>

      {/* Actions */}
      <div className="col-span-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onRestore}
          disabled={isPending}
          className="text-text-3 hover:text-primary flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-primary/5 disabled:opacity-50"
        >
          {isRestoring ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RotateCcw className="h-3.5 w-3.5" />
          )}
          복원
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-red-400 transition-colors hover:bg-red-500/5 disabled:opacity-50"
        >
          {isDeleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
          영구 삭제
        </button>
      </div>
    </div>
  );
}

export const TrashView = () => {
  const params = useParams();
  const [filterType, setFilterType] = useState<'all' | TrashItemType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [emptyConfirmOpen, setEmptyConfirmOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<TrashItem | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    id: string;
    action: 'restore' | 'delete';
  } | null>(null);

  const { data: dashboardData, isLoading: isLoadingProject } = useQuery(
    dashboardQueryOptions.stats(params.slug as string),
  );

  const projectId = dashboardData?.success
    ? dashboardData.data.project.id
    : undefined;

  const { data: trashData, isLoading: isLoadingTrash } = useTrashItems(
    projectId ?? '',
  );
  const restore = useRestoreItem(projectId ?? '');
  const permanentDelete = usePermanentDelete(projectId ?? '');
  const emptyTrashMutation = useEmptyTrash(projectId ?? '');

  const trashItems = trashData?.success ? trashData.data : [];

  const filteredItems = useMemo(() => {
    let items = trashItems;
    if (filterType !== 'all') {
      items = items.filter((item) => item.type === filterType);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      items = items.filter((item) => item.title.toLowerCase().includes(query));
    }
    return items;
  }, [trashItems, filterType, searchQuery]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: trashItems.length };
    for (const item of trashItems) {
      counts[item.type] = (counts[item.type] ?? 0) + 1;
    }
    return counts;
  }, [trashItems]);

  const handleRestore = (item: TrashItem) => {
    setPendingAction({ id: item.id, action: 'restore' });
    restore.mutate(
      { targetType: item.type, targetId: item.id },
      {
        onSuccess: () => {
          toast.success(`${TYPE_CONFIG[item.type].label}이(가) 복원되었습니다.`);
          setPendingAction(null);
        },
        onError: (error) => {
          toast.error(error.message);
          setPendingAction(null);
        },
      },
    );
  };

  const handlePermanentDelete = (item: TrashItem) => {
    setDeleteConfirm(item);
  };

  const confirmPermanentDelete = () => {
    if (!deleteConfirm) return;
    setPendingAction({ id: deleteConfirm.id, action: 'delete' });
    permanentDelete.mutate(
      { targetType: deleteConfirm.type, targetId: deleteConfirm.id },
      {
        onSuccess: () => {
          toast.success('영구 삭제되었습니다.');
          setDeleteConfirm(null);
          setPendingAction(null);
        },
        onError: (error) => {
          toast.error(error.message);
          setDeleteConfirm(null);
          setPendingAction(null);
        },
      },
    );
  };

  const handleEmptyTrash = () => {
    emptyTrashMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success('휴지통이 비워졌습니다.');
        setEmptyConfirmOpen(false);
      },
      onError: (error) => {
        toast.error(error.message);
        setEmptyConfirmOpen(false);
      },
    });
  };

  if (isLoadingProject || isLoadingTrash) {
    return (
      <Container className="bg-bg-1 text-text-1 flex min-h-screen font-sans">
        <Aside />
        <MainContainer className="flex flex-1 items-center justify-center">
          <LoadingSpinner size="lg" />
        </MainContainer>
      </Container>
    );
  }

  if (!dashboardData?.success) {
    return (
      <Container className="bg-bg-1 text-text-1 flex min-h-screen font-sans">
        <Aside />
        <MainContainer className="flex flex-1 items-center justify-center">
          <div className="text-red-400">프로젝트를 불러올 수 없습니다.</div>
        </MainContainer>
      </Container>
    );
  }

  return (
    <Container className="bg-bg-1 text-text-1 flex min-h-screen font-sans">
      <Aside />
      <MainContainer className="flex min-h-screen w-full flex-1">
        <div className="mx-auto grid w-full max-w-[1000px] flex-1 content-start gap-y-6 px-10 py-8">
          {/* Header */}
          <header className="border-line-2 flex items-end justify-between border-b pb-6">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                  <Trash2 className="h-5 w-5 text-red-400" />
                </div>
                <h2 className="typo-h1-heading text-text-1">휴지통</h2>
              </div>
              <p className="typo-body2-normal text-text-3 mt-2">
                삭제된 항목은 30일 후 자동으로 영구 삭제됩니다.
              </p>
            </div>
            {trashItems.length > 0 && (
              <DSButton
                variant="text"
                size="small"
                className="text-red-400 hover:bg-red-500/10"
                onClick={() => setEmptyConfirmOpen(true)}
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                휴지통 비우기
              </DSButton>
            )}
          </header>

          {/* Filter tabs + Search */}
          {trashItems.length > 0 && (
            <div className="flex items-center justify-between gap-4">
              <div className="flex gap-1">
                {FILTER_OPTIONS.map((opt) => {
                  const count = typeCounts[opt.value] ?? 0;
                  const isActive = filterType === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFilterType(opt.value)}
                      className={cn(
                        'typo-body2-normal flex items-center gap-1.5 rounded-lg px-3 py-2 transition-colors',
                        isActive
                          ? 'bg-bg-3 text-text-1 font-medium'
                          : 'text-text-3 hover:text-text-2 hover:bg-bg-2',
                      )}
                    >
                      {opt.label}
                      <span
                        className={cn(
                          'typo-label-normal rounded-full px-1.5 py-0.5 min-w-[20px] text-center',
                          isActive ? 'bg-bg-4 text-text-2' : 'bg-bg-2 text-text-3',
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search */}
              <div className="border-line-2 flex items-center gap-2 rounded-lg border bg-bg-2 px-3 py-2">
                <Search className="h-4 w-4 text-text-3" />
                <input
                  type="text"
                  placeholder="검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="typo-body2-normal text-text-1 placeholder:text-text-3 w-48 bg-transparent focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-text-3 hover:text-text-2"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Items list */}
          {filteredItems.length > 0 ? (
            <section className="rounded-4 border-line-2 bg-bg-2 shadow-1 overflow-hidden border">
              {/* Table header */}
              <div className="border-line-2 grid grid-cols-12 gap-4 border-b bg-bg-3/50 px-6 py-3">
                <span className="typo-label-heading text-text-3 col-span-5 uppercase tracking-wider">
                  항목
                </span>
                <span className="typo-label-heading text-text-3 col-span-2 text-center uppercase tracking-wider">
                  삭제일
                </span>
                <span className="typo-label-heading text-text-3 col-span-2 text-center uppercase tracking-wider">
                  남은 기간
                </span>
                <span className="typo-label-heading text-text-3 col-span-3 text-right uppercase tracking-wider">
                  작업
                </span>
              </div>

              {/* Rows */}
              {filteredItems.map((item) => (
                <TrashItemRow
                  key={`${item.type}-${item.id}`}
                  item={item}
                  onRestore={() => handleRestore(item)}
                  onDelete={() => handlePermanentDelete(item)}
                  isRestoring={
                    pendingAction?.id === item.id &&
                    pendingAction?.action === 'restore'
                  }
                  isDeleting={
                    pendingAction?.id === item.id &&
                    pendingAction?.action === 'delete'
                  }
                />
              ))}
            </section>
          ) : trashItems.length > 0 ? (
            /* Search/filter yielded no results */
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <Search className="h-10 w-10 text-text-3/50" />
              <p className="typo-body2-normal text-text-3">
                검색 결과가 없습니다.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterType('all');
                }}
                className="typo-body2-normal text-primary hover:underline"
              >
                필터 초기화
              </button>
            </div>
          ) : (
            /* Empty trash state */
            <div className="flex flex-col items-center justify-center gap-4 py-24">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-bg-3">
                <Trash2 className="h-10 w-10 text-text-3/40" />
              </div>
              <div className="text-center">
                <p className="typo-h2-heading text-text-2">
                  휴지통이 비어있습니다
                </p>
                <p className="typo-body2-normal text-text-3 mt-1">
                  삭제한 항목이 여기에 표시됩니다.
                </p>
              </div>
            </div>
          )}
        </div>
      </MainContainer>

      {/* Empty trash confirmation dialog */}
      {emptyConfirmOpen && (
        <Dialog.Root defaultOpen>
          <Dialog.Portal>
            <Dialog.Overlay
              onClick={() =>
                !emptyTrashMutation.isPending && setEmptyConfirmOpen(false)
              }
            />
            <Dialog.Content className="bg-bg-2 border-line-2 rounded-4 w-full max-w-[420px] border p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <Dialog.Title className="typo-h2-heading text-text-1">
                    휴지통 비우기
                  </Dialog.Title>
                  <Dialog.Description className="text-text-3 typo-body2-normal mt-1.5">
                    휴지통의 모든 항목({trashItems.length}개)이 영구 삭제됩니다.
                    <br />
                    <span className="font-medium text-red-400">
                      이 작업은 되돌릴 수 없습니다.
                    </span>
                  </Dialog.Description>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <DSButton
                  variant="ghost"
                  size="small"
                  onClick={() => setEmptyConfirmOpen(false)}
                  disabled={emptyTrashMutation.isPending}
                >
                  취소
                </DSButton>
                <DSButton
                  variant="text"
                  size="small"
                  className="bg-red-500/10 text-red-400 hover:bg-red-500/20"
                  onClick={handleEmptyTrash}
                  disabled={emptyTrashMutation.isPending}
                >
                  {emptyTrashMutation.isPending ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      삭제 중...
                    </>
                  ) : (
                    '전체 영구 삭제'
                  )}
                </DSButton>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}

      {/* Permanent delete single item dialog */}
      {deleteConfirm && (
        <Dialog.Root defaultOpen>
          <Dialog.Portal>
            <Dialog.Overlay
              onClick={() =>
                !permanentDelete.isPending && setDeleteConfirm(null)
              }
            />
            <Dialog.Content className="bg-bg-2 border-line-2 rounded-4 w-full max-w-[420px] border p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <Dialog.Title className="typo-h2-heading text-text-1">
                    영구 삭제
                  </Dialog.Title>
                  <Dialog.Description className="text-text-3 typo-body2-normal mt-1.5">
                    <span className="text-text-1 font-medium">
                      "{deleteConfirm.title}"
                    </span>
                    을(를) 영구 삭제하시겠습니까?
                    <br />
                    <span className="font-medium text-red-400">
                      이 작업은 되돌릴 수 없습니다.
                    </span>
                  </Dialog.Description>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <DSButton
                  variant="ghost"
                  size="small"
                  onClick={() => setDeleteConfirm(null)}
                  disabled={permanentDelete.isPending}
                >
                  취소
                </DSButton>
                <DSButton
                  variant="text"
                  size="small"
                  className="bg-red-500/10 text-red-400 hover:bg-red-500/20"
                  onClick={confirmPermanentDelete}
                  disabled={permanentDelete.isPending}
                >
                  {permanentDelete.isPending ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      삭제 중...
                    </>
                  ) : (
                    '영구 삭제'
                  )}
                </DSButton>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </Container>
  );
};
