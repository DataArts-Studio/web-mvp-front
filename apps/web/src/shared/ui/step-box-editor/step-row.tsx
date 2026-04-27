'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@testea/util';
import { StepRowMenu } from './step-row-menu';

interface StepRowProps {
  id: string;
  index: number;
  total: number;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onInsertAbove: () => void;
  onInsertBelow: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onEnterOnLast?: () => void;
  isLast: boolean;
  placeholder?: string;
}

export const StepRow = ({
  id,
  index,
  total,
  value,
  disabled,
  onChange,
  onMoveUp,
  onMoveDown,
  onInsertAbove,
  onInsertBelow,
  onDuplicate,
  onDelete,
  onEnterOnLast,
  isLast,
  placeholder = '수행할 동작을 입력하세요',
}: StepRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && isLast && onEnterOnLast) {
      e.preventDefault();
      onEnterOnLast();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex flex-col gap-1.5 rounded-4 border border-line-2 bg-bg-2 px-3 py-2',
        isDragging && 'opacity-50 shadow-4'
      )}
    >
      {/* Header: drag handle + number + menu */}
      <div className="flex items-center">
        <button
          type="button"
          className={cn(
            'flex h-6 w-6 shrink-0 cursor-grab items-center justify-center rounded-2 text-text-3',
            'hover:bg-bg-3 hover:text-text-1 active:cursor-grabbing',
            'disabled:cursor-not-allowed disabled:opacity-40'
          )}
          disabled={disabled}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="ml-1 text-sm font-medium text-text-3">{index + 1}.</span>
        <div className="ml-auto">
          <StepRowMenu
            index={index}
            total={total}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            onInsertAbove={onInsertAbove}
            onInsertBelow={onInsertBelow}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Textarea — full width */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full resize-none rounded-3 border border-line-2 bg-bg-1 px-3 py-2 text-sm text-text-1',
          'placeholder:text-text-3 outline-none transition-colors focus:border-primary',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
        rows={2}
        disabled={disabled}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};
