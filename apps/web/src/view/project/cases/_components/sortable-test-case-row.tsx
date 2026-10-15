'use client';

import React from 'react';

import { useTranslations } from 'next-intl';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@testea/util';
import { GripVertical } from 'lucide-react';

interface SortableTestCaseRowProps {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export const SortableTestCaseRow = ({ id, children, disabled }: SortableTestCaseRowProps) => {
  const t = useTranslations('cases');
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: isDragging ? ('relative' as const) : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group/row border-b border-white/[0.05]',
        isDragging && 'bg-bg-3 opacity-50 shadow-lg'
      )}
    >
      <div className="flex items-center">
        {disabled ? (
          // 손잡이가 없어도 키 열이 같은 자리에 오도록 폭을 남긴다
          <span className="w-6 shrink-0" aria-hidden="true" />
        ) : (
          <button
            type="button"
            aria-label={t('ui.dragToReorder')}
            className="flex h-full w-6 shrink-0 cursor-grab items-center justify-center text-white/30 opacity-0 transition-opacity group-focus-within/row:opacity-100 group-hover/row:opacity-100 hover:text-white/70 focus-visible:opacity-100 active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
};
