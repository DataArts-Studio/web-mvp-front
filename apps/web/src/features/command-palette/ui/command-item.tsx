'use client';

import React from 'react';
import type { CommandItem as CommandItemType } from '../model/types';

interface CommandItemProps {
  item: CommandItemType;
  isActive: boolean;
  onSelect: () => void;
  onMouseEnter: () => void;
}

export const CommandItem = ({ item, isActive, onSelect, onMouseEnter }: CommandItemProps) => {
  const Icon = item.icon;

  return (
    <button
      type="button"
      className={`flex w-full items-center gap-3 rounded-3 px-3 py-2.5 text-left transition-colors ${
        isActive ? 'bg-bg-4 text-text-1' : 'text-text-2 hover:bg-bg-3'
      }`}
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
      data-active={isActive}
    >
      <Icon size={16} className="shrink-0 text-text-3" />
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate typo-body-normal">{item.title}</span>
        {item.subtitle && (
          <span className="shrink-0 typo-label-normal text-text-4">{item.subtitle}</span>
        )}
      </div>
    </button>
  );
};
