'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import { DSButton } from '@/shared/ui';

interface TrashHeaderProps {
  hasItems: boolean;
  onEmptyTrash: () => void;
}

export function TrashHeader({ hasItems, onEmptyTrash }: TrashHeaderProps) {
  return (
    <header className="border-line-2 flex items-end justify-between border-b pb-6">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
            <Trash2 className="h-5 w-5 text-red-400" />
          </div>
          <h2 className="typo-h1-heading text-text-1">휴지통</h2>
        </div>
        <p className="typo-body2-normal text-text-3 mt-2">
          삭제된 항목은 30일 후 자동으로 영구 삭제됩니다.
        </p>
      </div>
      {hasItems && (
        <DSButton
          variant="text"
          size="small"
          className="text-red-400 hover:bg-red-500/10"
          onClick={onEmptyTrash}
        >
          <Trash2 className="mr-1.5 h-4 w-4" />
          휴지통 비우기
        </DSButton>
      )}
    </header>
  );
}
