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
import { MainContainer } from '@/shared/lib/primitives';
import { LoadingSpinner, ProjectErrorFallback } from '@/shared/ui';
import { toast } from 'sonner';

import { TYPE_CONFIG } from './_components/trash-constants';
import { TrashHeader } from './_components/trash-header';
import { TrashToolbar } from './_components/trash-toolbar';
import { TrashList } from './_components/trash-list';
import { EmptyTrashDialog } from './_components/empty-trash-dialog';
import { DeleteConfirmDialog } from './_components/delete-confirm-dialog';

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

  const trashItems = useMemo(() => trashData?.success ? trashData.data : [], [trashData]);

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
      <MainContainer className="flex flex-1 items-center justify-center">
        <LoadingSpinner size="lg" />
      </MainContainer>
    );
  }

  if (!dashboardData?.success) return <ProjectErrorFallback />;

  return (
    <>
      <MainContainer className="flex min-h-screen w-full flex-1">
        <div className="mx-auto grid w-full max-w-[1000px] flex-1 content-start gap-y-6 px-10 py-8">
          <TrashHeader
            hasItems={trashItems.length > 0}
            onEmptyTrash={() => setEmptyConfirmOpen(true)}
          />

          {trashItems.length > 0 && (
            <TrashToolbar
              filterType={filterType}
              onFilterChange={setFilterType}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              typeCounts={typeCounts}
            />
          )}

          <TrashList
            filteredItems={filteredItems}
            hasItems={trashItems.length > 0}
            pendingAction={pendingAction}
            onRestore={handleRestore}
            onDelete={handlePermanentDelete}
            onResetFilters={() => {
              setSearchQuery('');
              setFilterType('all');
            }}
          />
        </div>
      </MainContainer>

      {emptyConfirmOpen && (
        <EmptyTrashDialog
          itemCount={trashItems.length}
          isPending={emptyTrashMutation.isPending}
          onConfirm={handleEmptyTrash}
          onCancel={() => setEmptyConfirmOpen(false)}
        />
      )}

      {deleteConfirm && (
        <DeleteConfirmDialog
          item={deleteConfirm}
          isPending={permanentDelete.isPending}
          onConfirm={confirmPermanentDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </>
  );
};
