'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/shared/utils';
import { DragHandle } from './drag-handle';

interface SortableRowProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const SortableRow = ({ id, children, className, disabled }: SortableRowProps) => {
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
    position: isDragging ? 'relative' : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        isDragging && 'opacity-50 shadow-lg bg-bg-3 rounded-2',
        className,
      )}
    >
      <div className="flex items-center">
        {!disabled && (
          <DragHandle listeners={listeners} attributes={attributes} className="mr-1" />
        )}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
};
