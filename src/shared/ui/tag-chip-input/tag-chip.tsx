'use client';

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/shared/utils';

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
        'inline-flex items-center gap-1.5 rounded-full border border-line-2 bg-bg-3 py-1 pl-3 pr-1.5',
        shake && 'animate-shake',
      )}
    >
      <span className="typo-caption-normal text-text-2 max-w-[200px] truncate">{label}</span>
      {!disabled && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`${label} 삭제`}
          className="flex h-4 w-4 items-center justify-center rounded-full text-text-3 transition-colors hover:bg-bg-4 hover:text-system-red"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
};
