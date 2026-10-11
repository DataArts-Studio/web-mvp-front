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
          // 연속 입력을 위해 요청 전에 비웠던 입력값을, 새로 입력 중이 아니면 되돌린다 (#371).
          if (inputRef.current && !inputRef.current.value) inputRef.current.value = title;
          toast.error(translateCaseErrors(t, error.message) || t('ui.createFailedFallback'));
        },
      }
    );
  };

  return (
    <div className="border-line-2 bg-primary/5 hover:bg-primary/10 flex items-center gap-3 border-b px-4 py-3 transition-colors">
      <div
        aria-hidden="true"
        className="rounded-1 bg-primary/20 text-primary flex h-6 w-6 shrink-0 items-center justify-center"
      >
        <Plus className="h-4 w-4" />
      </div>
      <Input
        ref={inputRef}
        type="text"
        aria-label={t('ui.quickCreateAriaLabel')}
        placeholder={t('ui.quickCreatePlaceholder')}
        className="typo-body2-normal text-text-1 placeholder:text-text-3 flex-1 bg-transparent focus:outline-none"
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleCreate();
        }}
      />
    </div>
  );
};
