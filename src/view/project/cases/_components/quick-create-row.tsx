'use client';

import React, { useRef } from 'react';
import { Plus } from 'lucide-react';
import { Input } from '@/shared/lib/primitives';
import { useCreateCase } from '@/features/cases-create';
import { toast } from 'sonner';

interface QuickCreateRowProps {
  projectId: string;
  selectedSuiteId: string;
}

export const QuickCreateRow = ({ projectId, selectedSuiteId }: QuickCreateRowProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { mutate } = useCreateCase();

  const handleCreate = () => {
    const title = inputRef.current?.value.trim();
    if (!title) return;

    if (inputRef.current) inputRef.current.value = '';

    const suiteId = selectedSuiteId !== 'all' && selectedSuiteId !== '__uncategorized__' ? selectedSuiteId : undefined;
    mutate(
      { title, projectId, ...(suiteId ? { testSuiteId: suiteId } : {}) },
      {
        onError: (error) => {
          toast.error(error.message || '테스트 케이스 생성에 실패했습니다.');
        },
      },
    );
  };

  return (
    <div className="flex items-center gap-3 border-b border-line-2 bg-primary/5 px-4 py-3 transition-colors hover:bg-primary/10">
      <div className="rounded-1 bg-primary/20 text-primary flex h-6 w-6 shrink-0 items-center justify-center">
        <Plus className="h-4 w-4" />
      </div>
      <Input
        ref={inputRef}
        type="text"
        placeholder="새로운 테스트 케이스 이름을 입력하고 Enter를 누르세요..."
        className="typo-body2-normal text-text-1 placeholder:text-text-3 flex-1 bg-transparent focus:outline-none"
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleCreate();
        }}
      />
    </div>
  );
};
