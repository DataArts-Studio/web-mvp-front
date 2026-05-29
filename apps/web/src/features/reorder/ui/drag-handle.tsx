'use client';

import React from 'react';

import { cn } from '@testea/util';
import { GripVertical } from 'lucide-react';

interface DragHandleProps {
  listeners?: Record<string, (event: unknown) => void>;
  attributes?: Record<string, unknown>;
  className?: string;
}

export const DragHandle = ({ listeners, attributes, className }: DragHandleProps) => {
  return (
    <button
      type="button"
      className={cn(
        'rounded-1 text-text-4 hover:bg-bg-4 hover:text-text-2 flex h-6 w-6 shrink-0 cursor-grab items-center justify-center transition-colors active:cursor-grabbing',
        className
      )}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-4 w-4" />
    </button>
  );
};
