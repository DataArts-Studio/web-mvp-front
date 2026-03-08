'use client';

import React from 'react';
import { RotateCcw, Trash2, Loader2, Clock } from 'lucide-react';
import { cn } from '@/shared/utils';
import type { TrashItem } from '@/features/trash';
import { TYPE_CONFIG, formatDeletedDate } from './trash-constants';

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

interface TrashItemRowProps {
  item: TrashItem;
  onRestore: () => void;
  onDelete: () => void;
  isRestoring: boolean;
  isDeleting: boolean;
}

export function TrashItemRow({
  item,
  onRestore,
  onDelete,
  isRestoring,
  isDeleting,
}: TrashItemRowProps) {
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
