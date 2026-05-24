'use client';

import React, { useEffect, useRef, useState } from 'react';

import { cn } from '@testea/util';
import { Bot, Download, MoreVertical, Upload } from 'lucide-react';

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
        aria-label="더 보기"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'typo-body2-heading rounded-2 border-line-2 bg-bg-2 text-text-2 hover:bg-bg-3 flex cursor-pointer items-center justify-center border px-2.5 py-2 transition-colors',
          open && 'bg-bg-3'
        )}
      >
        <MoreVertical className="h-4 w-4" aria-hidden="true" />
      </button>

      {open && (
        <div
          aria-label="더 보기"
          className="rounded-2 border-line-2 bg-bg-2 absolute top-full right-0 z-50 mt-1 min-w-[160px] border py-1 shadow-lg"
        >
          {MORE_ACTIONS.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                handlers[key]();
                setOpen(false);
              }}
              className="text-text-2 hover:bg-bg-3 hover:text-text-1 flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors"
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="typo-body2-normal">{label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
