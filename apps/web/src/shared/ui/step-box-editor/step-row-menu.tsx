'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  ArrowDown,
  ArrowUpFromLine,
  ArrowDownFromLine,
  Copy,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import { cn } from '@testea/util';

interface StepRowMenuProps {
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onInsertAbove: () => void;
  onInsertBelow: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  disabled?: boolean;
}

type MenuItem = {
  icon: React.ElementType;
  label: string;
  action: () => void;
  isDisabled: boolean;
};

export const StepRowMenu = ({
  index,
  total,
  onMoveUp,
  onMoveDown,
  onInsertAbove,
  onInsertBelow,
  onDuplicate,
  onDelete,
  disabled,
}: StepRowMenuProps) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [focusIndex, setFocusIndex] = useState(-1);

  const items: MenuItem[] = [
    { icon: ArrowUp, label: '위로 이동', action: onMoveUp, isDisabled: index === 0 },
    { icon: ArrowDown, label: '아래로 이동', action: onMoveDown, isDisabled: index === total - 1 },
    { icon: ArrowUpFromLine, label: '위에 삽입', action: onInsertAbove, isDisabled: false },
    { icon: ArrowDownFromLine, label: '아래에 삽입', action: onInsertBelow, isDisabled: false },
    { icon: Copy, label: '복제', action: onDuplicate, isDisabled: false },
    { icon: Trash2, label: '삭제', action: onDelete, isDisabled: total <= 1 },
  ];

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (open) setFocusIndex(-1);
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusIndex((prev) => {
        let next = prev + 1;
        while (next < items.length && items[next].isDisabled) next++;
        return next < items.length ? next : prev;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusIndex((prev) => {
        let next = prev - 1;
        while (next >= 0 && items[next].isDisabled) next--;
        return next >= 0 ? next : prev;
      });
    } else if (e.key === 'Enter' && focusIndex >= 0) {
      e.preventDefault();
      const item = items[focusIndex];
      if (!item.isDisabled) {
        item.action();
        setOpen(false);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      buttonRef.current?.focus();
    }
  };

  return (
    <div className="relative" onKeyDown={handleKeyDown}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-3 transition-colors',
          'text-text-3 hover:bg-bg-3 hover:text-text-1',
          'disabled:opacity-40 disabled:cursor-not-allowed'
        )}
        aria-label="행 메뉴"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          className="bg-bg-2 border-line-2 absolute right-0 top-full z-20 mt-1 min-w-[140px] rounded-4 border py-1 shadow-4"
        >
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                disabled={item.isDisabled}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-1.5 text-sm transition-colors',
                  focusIndex === i && 'bg-bg-3',
                  item.isDisabled
                    ? 'text-text-3 cursor-not-allowed opacity-40'
                    : 'text-text-1 hover:bg-bg-3',
                  item.label === '삭제' && !item.isDisabled && 'text-system-red hover:text-system-red'
                )}
                onClick={() => {
                  if (!item.isDisabled) {
                    item.action();
                    setOpen(false);
                  }
                }}
                onMouseEnter={() => setFocusIndex(i)}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
