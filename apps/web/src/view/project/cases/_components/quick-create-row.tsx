'use client';

import React, { useRef } from 'react';

import { useTranslations } from 'next-intl';

import { translateCaseErrors } from '@/entities/test-case/lib/translate-message';
import { useCreateCase } from '@/features/cases-create';
import { Input } from '@testea/ui';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

interface QuickCreateRowProps {
  projectId: string;
  selectedSuiteId: string;
}

export const QuickCreateRow = ({ projectId, selectedSuiteId }: QuickCreateRowProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { mutate, isPending } = useCreateCase();
  const t = useTranslations('cases');

  const handleCreate = () => {
    const title = inputRef.current?.value.trim();
    // 이전 생성이 끝나기 전에는 새로 제출하지 않는다. 동시에 여러 건이 실패하면
    // 어떤 제목을 되돌릴지 알 수 없다 (#371).
    if (!title || isPending) return;

    if (inputRef.current) inputRef.current.value = '';

    const suiteId =
      selectedSuiteId !== 'all' && selectedSuiteId !== '__uncategorized__'
        ? selectedSuiteId
        : undefined;
    mutate(
      { title, projectId, ...(suiteId ? { testSuiteId: suiteId } : {}) },
      {
        onError: (error) => {
          // 다음 입력을 이어 쓰지 않았다면 실패한 제목을 되돌려 바로 재시도할 수 있게 한다.
          if (inputRef.current && !inputRef.current.value) inputRef.current.value = title;
          toast.error(translateCaseErrors(t, error.message) || t('ui.createFailedFallback'));
        },
      }
    );
  };

  return (
    <div className="flex items-center gap-2 border-b border-white/[0.05] py-2.5 pr-2.5 pl-6 focus-within:bg-white/[0.03] hover:bg-white/[0.02]">
      <Plus aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-white/40" />
      <Input
        ref={inputRef}
        type="text"
        aria-label={t('ui.quickCreateAriaLabel')}
        placeholder={t('ui.quickCreatePlaceholder')}
        className="flex-1 bg-transparent text-[13px] text-white/90 placeholder:text-white/35 focus:outline-none"
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleCreate();
        }}
      />
    </div>
  );
};
