'use client';

import React from 'react';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@testea/util';
import { GripVertical } from 'lucide-react';

interface SortableScenarioRowProps {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export const SortableScenarioRow = ({ id, children, disabled }: SortableScenarioRowProps) => {
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
      className={cn(isDragging && 'bg-bg-3 opacity-50 shadow-lg')}
    >
      <div className="flex items-stretch">
        {!disabled && (
          <button
            type="button"
            aria-label="드래그하여 순서 변경"
            className="text-text-4 hover:text-text-2 flex w-6 shrink-0 cursor-grab items-center justify-center active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
};
