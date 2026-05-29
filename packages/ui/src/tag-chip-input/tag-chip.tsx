'use client';

import React from 'react';

import { cn } from '@testea/util';
import { X } from 'lucide-react';

interface TagChipProps {
  label: string;
  onRemove: () => void;
  disabled?: boolean;
  shake?: boolean;
}

export const TagChip = ({ label, onRemove, disabled, shake }: TagChipProps) => {
  return (
    <span
      className={cn(
        'border-line-2 bg-bg-3 inline-flex items-center gap-1.5 rounded-full border py-1 pr-1.5 pl-3',
        shake && 'animate-shake'
      )}
    >
      <span className="typo-caption-normal text-text-2 max-w-[200px] truncate">{label}</span>
      {!disabled && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`${label} 삭제`}
          className="text-text-3 hover:bg-bg-4 hover:text-system-red flex h-4 w-4 items-center justify-center rounded-full transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
};
