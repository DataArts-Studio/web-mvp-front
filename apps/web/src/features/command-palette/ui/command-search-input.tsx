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
      <div className="flex items-center gap-3 border-b border-line-1 px-4 py-3">
        <Search size={18} className="shrink-0 text-text-3" />
        <input
          ref={ref}
          type="text"
          className="flex-1 bg-transparent text-text-1 typo-body-normal placeholder:text-text-4 outline-none"
          placeholder="검색 또는 이동..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <kbd className="shrink-0 rounded-2 border border-line-2 bg-bg-3 px-1.5 py-0.5 typo-label-normal text-text-4">
          ESC
        </kbd>
      </div>
    );
  },
);

CommandSearchInput.displayName = 'CommandSearchInput';
