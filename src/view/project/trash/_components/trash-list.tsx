'use client';

import React from 'react';
import { Search, Trash2 } from 'lucide-react';
import { EmptyState } from '@/shared/ui';
import type { TrashItem } from '@/features/trash';
import { TrashItemRow } from './trash-item-row';

interface TrashListProps {
  filteredItems: TrashItem[];
  hasItems: boolean;
  pendingAction: { id: string; action: 'restore' | 'delete' } | null;
  onRestore: (item: TrashItem) => void;
  onDelete: (item: TrashItem) => void;
  onResetFilters: () => void;
}

export function TrashList({
  filteredItems,
  hasItems,
  pendingAction,
  onRestore,
  onDelete,
  onResetFilters,
}: TrashListProps) {
  if (filteredItems.length > 0) {
    return (
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
            onRestore={() => onRestore(item)}
            onDelete={() => onDelete(item)}
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
    );
  }

  if (hasItems) {
    return (
      <EmptyState
        icon={<Search className="h-10 w-10" />}
        title="검색 결과가 없습니다."
        className="py-20"
        action={
          <button
            type="button"
            onClick={onResetFilters}
            className="typo-body2-normal text-primary hover:underline"
          >
            필터 초기화
          </button>
        }
      />
    );
  }

  return (
    <EmptyState
      icon={<Trash2 className="h-10 w-10" />}
      title="휴지통이 비어있습니다"
      description="삭제한 항목이 여기에 표시됩니다."
      className="py-24"
    />
  );
}
