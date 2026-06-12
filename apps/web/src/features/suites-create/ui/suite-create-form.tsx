'use client';
import React, { useEffect, useId, useRef } from 'react';
import { useForm } from 'react-hook-form';

import { useTranslations } from 'next-intl';

import { CreateTestSuiteSchema } from '@/entities/test-suite';
import type { CreateTestSuite } from '@/entities/test-suite';
import { useCreateSuite } from '@/features/suites-create';
import { TESTSUITE_EVENTS, track } from '@/shared/lib/analytics';
import { zodResolver } from '@hookform/resolvers/zod';
import { DSButton, LoadingSpinner } from '@testea/ui';
import { FormField } from '@testea/ui';
import { cn } from '@testea/util';
import { Check, FolderPlus } from 'lucide-react';

interface SuiteCreateFormProps {
  projectId: string;
  onClose?: () => void;
}

export const SuiteCreateForm = ({ projectId, onClose }: SuiteCreateFormProps) => {
  const t = useTranslations('suites');
  const { mutate, isPending } = useCreateSuite();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateTestSuite>({
    resolver: zodResolver(CreateTestSuiteSchema),
    defaultValues: {
      projectId,
      title: '',
      description: '',
      sortOrder: 0,
    },
  });
  const titleLength = (watch('title') ?? '').length;

  const onSubmit = async (data: CreateTestSuite) => {
    mutate(data, {
      onSuccess: () => {
        track(TESTSUITE_EVENTS.CREATE_COMPLETE, { project_id: projectId });
        onClose?.();
      },
      onError: () => {
        track(TESTSUITE_EVENTS.CREATE_FAIL, { project_id: projectId });
      },
    });
  };

  const handleAbandon = () => {
    track(TESTSUITE_EVENTS.CREATE_ABANDON, { project_id: projectId });
    onClose?.();
  };

  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  // 모달 a11y: 진입 시 포커스 이동, 닫을 때 트리거로 포커스 복귀,
  // ESC 닫기, Tab 포커스 트랩(모달 밖으로 못 나가게).
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const node = dialogRef.current;
    node?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        handleAbandon();
        return;
      }
      if (e.key !== 'Tab' || !node) return;
      const focusables = node.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    node?.addEventListener('keydown', handleKeyDown);
    return () => {
      node?.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus?.();
    };
    // 마운트/언마운트 시 1회만 (handleAbandon 은 안정적)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section
      id="create-suite"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleAbandon}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="bg-bg-2 shadow-4 border-line-2 relative flex max-h-[85vh] w-full max-w-[520px] flex-col overflow-hidden rounded-2xl border outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {isPending && (
          <div className="bg-bg-2/80 absolute inset-0 z-10 flex items-center justify-center rounded-2xl backdrop-blur-sm">
            <LoadingSpinner size="md" text={t('ui.creating')} />
          </div>
        )}

        {/* Hero header (top) */}
        <header className="from-primary/12 via-bg-2 to-bg-2 relative shrink-0 overflow-hidden bg-gradient-to-b px-6 pt-6 pb-5 sm:px-7">
          {/* soft accent glow */}
          <div
            aria-hidden
            className="bg-primary/25 pointer-events-none absolute -top-16 -right-10 h-44 w-44 rounded-full blur-3xl"
          />
          <div className="relative flex items-start gap-4">
            <div className="bg-primary/15 text-primary ring-primary/20 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1">
              <FolderPlus className="h-5.5 w-5.5" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <h2 id={titleId} className="text-text-1 text-xl font-bold">
                {t('ui.createTitle')}
              </h2>
              <p className="text-text-3 mt-1 text-sm leading-relaxed">{t('ui.createPanelBody')}</p>
            </div>
          </div>
          <ul className="relative mt-4 flex flex-wrap gap-x-4 gap-y-2">
            {[t('ui.createPanelPoint1'), t('ui.createPanelPoint2'), t('ui.createPanelPoint3')].map(
              (point) => (
                <li key={point} className="text-text-2 flex items-center gap-1.5 text-xs">
                  <span className="bg-primary/15 text-primary flex h-4 w-4 shrink-0 items-center justify-center rounded-full">
                    <Check className="h-2.5 w-2.5" strokeWidth={2.5} />
                  </span>
                  <span>{point}</span>
                </li>
              )
            )}
          </ul>
        </header>

        {/* Body */}
        <form
          id="suite-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col gap-5 overflow-y-auto p-6 sm:p-7"
          noValidate
        >
          <input type="hidden" {...register('projectId')} />
          <FormField.Root className="flex flex-col gap-1.5">
            <FormField.Label className="text-text-1 flex items-center text-sm font-medium">
              <span>
                {t('ui.nameLabel')} <span className="text-primary">*</span>
              </span>
              <span className="text-text-3 ml-auto text-xs tabular-nums">{titleLength}/50</span>
            </FormField.Label>
            <FormField.Control
              placeholder={t('ui.namePlaceholder')}
              type="text"
              disabled={isPending}
              {...register('title', {
                required: t('ui.nameRequired'),
                minLength: {
                  value: 3,
                  message: t('ui.nameMin'),
                },
                maxLength: {
                  value: 50,
                  message: t('ui.nameMax'),
                },
                validate: (value) => !!value.trim() || t('ui.nameBlank'),
                pattern: {
                  value: /^[a-zA-Z0-9가-힣\s._-]+$/,
                  message: t('ui.namePattern'),
                },
              })}
              className={cn(
                'rounded-5 border-line-2 bg-bg-1 text-text-1 placeholder:text-text-3 hover:border-line-3 focus:border-primary focus:ring-primary/15 h-11 w-full border px-4 text-sm transition-colors outline-none focus:ring-4',
                errors.title && 'border-system-red focus:border-system-red focus:ring-system-red/15'
              )}
            />
            {errors.title && (
              <span className="text-system-red text-sm">{errors.title.message}</span>
            )}
          </FormField.Root>
          <FormField.Root className="flex flex-col gap-1.5">
            <FormField.Label className="text-text-1 text-sm font-medium">
              {t('ui.descriptionLabel')}
            </FormField.Label>
            <textarea
              placeholder={t('ui.descriptionPlaceholder')}
              rows={3}
              disabled={isPending}
              {...register('description')}
              className="rounded-5 border-line-2 bg-bg-1 text-text-1 placeholder:text-text-3 hover:border-line-3 focus:border-primary focus:ring-primary/15 min-h-[88px] w-full resize-none border px-4 py-3 text-sm leading-relaxed transition-colors outline-none focus:ring-4"
            />
          </FormField.Root>
        </form>

        {/* Actions */}
        <div className="flex shrink-0 items-center justify-end gap-1.5 px-6 pt-1 pb-6 sm:px-7">
          <DSButton
            type="button"
            variant="text"
            size="small"
            disabled={isPending}
            onClick={handleAbandon}
          >
            {t('ui.cancel')}
          </DSButton>
          <DSButton
            type="submit"
            form="suite-form"
            variant="solid"
            size="small"
            className="min-w-[112px]"
            disabled={isPending}
          >
            {isPending ? t('ui.creatingShort') : t('ui.create')}
          </DSButton>
        </div>
      </div>
    </section>
  );
};
