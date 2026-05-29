'use client';

import React, { forwardRef } from 'react';

import { Search } from 'lucide-react';

interface CommandSearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const CommandSearchInput = forwardRef<HTMLInputElement, CommandSearchInputProps>(
  ({ value, onChange }, ref) => {
    return (
      <div className="border-line-1 flex items-center gap-3 border-b px-4 py-3">
        <Search size={18} className="text-text-3 shrink-0" />
        <input
          ref={ref}
          type="text"
          className="text-text-1 typo-body-normal placeholder:text-text-4 flex-1 bg-transparent outline-none"
          placeholder="검색 또는 이동..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <kbd className="rounded-2 border-line-2 bg-bg-3 typo-label-normal text-text-4 shrink-0 border px-1.5 py-0.5">
          ESC
        </kbd>
      </div>
    );
  }
);

CommandSearchInput.displayName = 'CommandSearchInput';
