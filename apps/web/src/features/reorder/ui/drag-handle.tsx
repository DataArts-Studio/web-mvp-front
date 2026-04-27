'use client';

import React from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '@/shared/utils';

interface DragHandleProps {
  listeners?: Record<string, Function>;
  attributes?: Record<string, unknown>;
  className?: string;
}

export const DragHandle = ({ listeners, attributes, className }: DragHandleProps) => {
  return (
    <button
      type="button"
      className={cn(
        'flex h-6 w-6 shrink-0 cursor-grab items-center justify-center rounded-1 text-text-4 transition-colors hover:bg-bg-4 hover:text-text-2 active:cursor-grabbing',
        className,
      )}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-4 w-4" />
    </button>
  );
};
