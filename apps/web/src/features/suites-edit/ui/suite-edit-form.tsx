'use client';
import React, { useEffect, useId, useRef } from 'react';
import { useForm } from 'react-hook-form';

import { useTranslations } from 'next-intl';

import { TestSuite } from '@/entities/test-suite';
import { DSButton, FormField, LoadingSpinner, cn } from '@/shared';
import { TESTSUITE_EVENTS, track } from '@/shared/lib/analytics';
import { zodResolver } from '@hookform/resolvers/zod';

import { useUpdateSuite } from '../hooks';
import { UpdateTestSuite, UpdateTestSuiteSchema } from '../model';

interface SuiteEditFormProps {
  suite: TestSuite;
  onClose?: () => void;
}

export const SuiteEditForm = ({ suite, onClose }: SuiteEditFormProps) => {
  const t = useTranslations('suites');
  const { mutate, isPending } = useUpdateSuite();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateTestSuite>({
    resolver: zodResolver(UpdateTestSuiteSchema),
    defaultValues: {
      id: suite.id,
      title: suite.title,
      description: suite.description,
    },
  });

  const onSubmit = async (data: UpdateTestSuite) => {
    mutate(data, {
      onSuccess: () => {
        track(TESTSUITE_EVENTS.UPDATE, { suite_id: suite.id });
        onClose?.();
      },
      onError: () => {
        track(TESTSUITE_EVENTS.UPDATE_FAIL, { suite_id: suite.id });
      },
    });
  };

  const handleAbandon = () => {
    track(TESTSUITE_EVENTS.UPDATE_ABANDON, { suite_id: suite.id });
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
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
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
      id="edit-suite"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleAbandon}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="bg-bg-2 shadow-4 relative w-[600px] overflow-hidden rounded-xl p-8 outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {isPending && (
          <div className="bg-bg-2/80 absolute inset-0 z-10 flex items-center justify-center rounded-xl backdrop-blur-sm">
            <LoadingSpinner size="md" text={t('ui.editLoading')} />
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8" noValidate>
          <input type="hidden" {...register('id')} />
          {/* Header */}
          <div className="border-line-1 border-b pb-6">
            <h2 id={titleId} className="text-primary text-3xl">
              {t('ui.editTitle')}
            </h2>
            <p className="mt-2 text-base text-neutral-400">{t('ui.editSubtitle')}</p>
          </div>
          {/* Body */}
          <div className="flex flex-col gap-6">
            <FormField.Root className="flex flex-col gap-2">
              <FormField.Label className="text-text-1 font-medium">
                {t('ui.nameLabel')} <span className="text-primary">*</span>
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
                  'rounded-4 border-line-2 bg-bg-1 text-text-1 placeholder:text-text-2 focus:border-primary h-[56px] w-full border px-6 text-base transition-colors outline-none',
                  errors.title && 'border-system-red focus:border-system-red'
                )}
              />
              {errors.title && (
                <span className="text-system-red mt-1 text-sm">{errors.title.message}</span>
              )}
            </FormField.Root>
            <FormField.Root className="flex flex-col gap-2">
              <FormField.Label className="text-text-1 font-medium">
                {t('ui.descriptionLabel')}
              </FormField.Label>
              <FormField.Control
                placeholder={t('ui.descriptionPlaceholder')}
                type="text"
                disabled={isPending}
                {...register('description')}
                className="rounded-4 border-line-2 bg-bg-1 text-text-1 placeholder:text-text-2 focus:border-primary h-[56px] w-full border px-6 text-base transition-colors outline-none"
              />
            </FormField.Root>
          </div>
          <div className="border-line-1 flex gap-3 border-t pt-6">
            <DSButton
              type="button"
              variant="ghost"
              className="w-full"
              disabled={isPending}
              onClick={handleAbandon}
            >
              {t('ui.cancel')}
            </DSButton>
            <DSButton type="submit" variant="solid" className="w-full" disabled={isPending}>
              {isPending ? t('ui.editingShort') : t('ui.edit')}
            </DSButton>
          </div>
        </form>
      </div>
    </section>
  );
};
