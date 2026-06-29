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
  const { mutate } = useCreateCase();
  const t = useTranslations('cases');

  const handleCreate = () => {
    const title = inputRef.current?.value.trim();
    if (!title) return;

    if (inputRef.current) inputRef.current.value = '';

    const suiteId =
      selectedSuiteId !== 'all' && selectedSuiteId !== '__uncategorized__'
        ? selectedSuiteId
        : undefined;
    mutate(
      { title, projectId, ...(suiteId ? { testSuiteId: suiteId } : {}) },
      {
        onError: (error) => {
          toast.error(translateCaseErrors(t, error.message) || t('ui.createFailedFallback'));
        },
      }
    );
  };

  return (
    <div className="border-line-2 hover:bg-bg-2 grid grid-cols-[88px_minmax(0,1fr)] items-center gap-4 border-y px-1 py-3 transition-colors">
      <div
        aria-hidden="true"
        className="text-text-4 flex h-7 w-7 shrink-0 items-center justify-center"
      >
        <Plus className="h-4 w-4" />
      </div>
      <Input
        ref={inputRef}
        type="text"
        aria-label={t('ui.quickCreateAriaLabel')}
        placeholder={t('ui.quickCreatePlaceholder')}
        className="typo-body2-normal text-text-1 placeholder:text-text-4 h-8 flex-1 bg-transparent focus:outline-none"
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleCreate();
        }}
      />
    </div>
  );
};
