'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, Download, Upload, MoreVertical } from 'lucide-react';
import { cn } from '@/shared/utils';

const MORE_ACTIONS = [
  { key: 'ai', icon: Bot, label: 'AI 생성' },
  { key: 'import', icon: Upload, label: '가져오기' },
  { key: 'export', icon: Download, label: '내보내기' },
] as const;

type MoreActionsKey = (typeof MORE_ACTIONS)[number]['key'];

interface MoreActionsMenuProps {
  onAiGenerate: () => void;
  onImport: () => void;
  onExport: () => void;
}

export const MoreActionsMenu = ({ onAiGenerate, onImport, onExport }: MoreActionsMenuProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handlers: Record<MoreActionsKey, () => void> = {
    ai: onAiGenerate,
    import: onImport,
    export: onExport,
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'typo-body2-heading rounded-2 border border-line-2 bg-bg-2 text-text-2 hover:bg-bg-3 flex items-center justify-center px-2.5 py-2 transition-colors cursor-pointer',
          open && 'bg-bg-3',
        )}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded-2 border border-line-2 bg-bg-2 py-1 shadow-lg">
          {MORE_ACTIONS.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                handlers[key]();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-text-2 transition-colors hover:bg-bg-3 hover:text-text-1"
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="typo-body2-normal">{label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
