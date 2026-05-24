'use client';
import React, { useEffect, useId, useRef } from 'react';
import { useForm } from 'react-hook-form';

import { CreateTestSuiteSchema } from '@/entities/test-suite';
import type { CreateTestSuite } from '@/entities/test-suite';
import { useCreateSuite } from '@/features/suites-create';
import { TESTSUITE_EVENTS, track } from '@/shared/lib/analytics';
import { zodResolver } from '@hookform/resolvers/zod';
import { DSButton, LoadingSpinner } from '@testea/ui';
import { FormField } from '@testea/ui';
import { cn } from '@testea/util';

interface SuiteCreateFormProps {
  projectId: string;
  onClose?: () => void;
}

export const SuiteCreateForm = ({ projectId, onClose }: SuiteCreateFormProps) => {
  const { mutate, isPending } = useCreateSuite();
  const {
    register,
    handleSubmit,
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
        className="bg-bg-2 shadow-4 relative flex max-h-[85vh] w-full max-w-[480px] flex-col overflow-hidden rounded-xl outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {isPending && (
          <div className="bg-bg-2/80 absolute inset-0 z-10 flex items-center justify-center rounded-xl backdrop-blur-sm">
            <LoadingSpinner size="md" text="테스트 스위트를 생성하고 있어요" />
          </div>
        )}
        {/* Header */}
        <div className="border-line-2 shrink-0 border-b px-6 py-5">
          <h2 id={titleId} className="text-text-1 text-lg font-bold">
            테스트 스위트 생성
          </h2>
          <p className="text-text-3 mt-1 text-sm">필요한 테스트들을 한 곳에 모아 관리해요</p>
        </div>

        {/* Body */}
        <form
          id="suite-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col gap-5 overflow-y-auto p-6"
          noValidate
        >
          <input type="hidden" {...register('projectId')} />
          <FormField.Root className="flex flex-col gap-2">
            <FormField.Label className="text-text-1 font-medium">
              스위트 이름 <span className="text-primary">*</span>
            </FormField.Label>
            <FormField.Control
              placeholder="스위트 이름을 입력해 주세요."
              type="text"
              disabled={isPending}
              {...register('title', {
                required: '유효한 이름을 입력해주세요.',
                minLength: {
                  value: 3,
                  message: '스위트 이름은 최소 3자 이상이어야 합니다.',
                },
                maxLength: {
                  value: 50,
                  message: '스위트 이름은 50자를 초과할 수 없습니다.',
                },
                validate: (value) => !!value.trim() || '공백만으로는 이름을 생성할 수 없습니다.',
                pattern: {
                  value: /^[a-zA-Z0-9가-힣\s._-]+$/,
                  message: '특수문자는 사용할 수 없습니다. (-, _, ., 공백만 허용)',
                },
              })}
              className={cn(
                'rounded-4 border-line-2 bg-bg-1 text-text-1 placeholder:text-text-2 focus:border-primary h-[56px] w-full border px-6 text-base transition-colors outline-none',
                errors.title && 'border-system-red focus:border-system-red'
              )}
            />
            {errors.title && (
              <span className="text-system-red text-sm">{errors.title.message}</span>
            )}
          </FormField.Root>
          <FormField.Root className="flex flex-col gap-2">
            <FormField.Label className="text-text-1 font-medium">설명 (선택)</FormField.Label>
            <FormField.Control
              placeholder="이 스위트에 대한 간략한 설명을 입력해주세요."
              type="text"
              disabled={isPending}
              {...register('description')}
              className="rounded-4 border-line-2 bg-bg-1 text-text-1 placeholder:text-text-2 focus:border-primary h-[56px] w-full border px-6 text-base transition-colors outline-none"
            />
          </FormField.Root>
        </form>

        {/* Actions */}
        <div className="border-line-2 flex shrink-0 gap-3 border-t px-6 py-4">
          <DSButton
            type="button"
            variant="ghost"
            className="w-full"
            disabled={isPending}
            onClick={handleAbandon}
          >
            취소
          </DSButton>
          <DSButton
            type="submit"
            form="suite-form"
            variant="solid"
            className="w-full"
            disabled={isPending}
          >
            {isPending ? '생성 중...' : '생성'}
          </DSButton>
        </div>
      </div>
    </section>
  );
};
