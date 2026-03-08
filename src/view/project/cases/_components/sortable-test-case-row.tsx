'use client';

import React from 'react';
import { GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/shared/utils';

interface SortableTestCaseRowProps {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export const SortableTestCaseRow = ({ id, children, disabled }: SortableTestCaseRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: isDragging ? 'relative' as const : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && 'opacity-50 shadow-lg bg-bg-3')}>
      <div className="flex items-center">
        {!disabled && (
          <button
            type="button"
            className="flex h-full w-6 shrink-0 cursor-grab items-center justify-center text-text-4 hover:text-text-2 active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
};
