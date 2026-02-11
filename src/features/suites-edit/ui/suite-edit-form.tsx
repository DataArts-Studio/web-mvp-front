'use client';
import React from 'react';
import { useForm } from 'react-hook-form';

import { TestSuite } from '@/entities/test-suite';
import { DSButton, FormField, LoadingSpinner, cn } from '@/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUpdateSuite } from '../hooks';
import { UpdateTestSuite, UpdateTestSuiteSchema } from '../model';
import { track, TESTSUITE_EVENTS } from '@/shared/lib/analytics';

interface SuiteEditFormProps {
  suite: TestSuite;
  onClose?: () => void;
}

export const SuiteEditForm = ({ suite, onClose }: SuiteEditFormProps) => {
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
    })
  };

  return (
    <section
      id="edit-suite"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div className="bg-bg-2 shadow-4 relative w-[600px] overflow-hidden rounded-xl p-8" onClick={(e) => e.stopPropagation()}>
        {isPending && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-bg-2/80 backdrop-blur-sm">
            <LoadingSpinner size="md" text="테스트 스위트를 수정하고 있어요" />
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8" noValidate>
          <input type="hidden" {...register('id')} />
          {/* Header */}
          <div className="border-line-1 border-b pb-6">
            <h2 className="text-primary text-3xl">테스트 스위트 수정</h2>
            <p className="mt-2 text-base text-neutral-400">
              테스트 스위트의 이름과 설명을 수정합니다.
            </p>
          </div>
          {/* Body */}
          <div className="flex flex-col gap-6">
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
                    value: 5,
                    message: '스위트 이름은 최소 5자 이상이어야 합니다.',
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
                  'h-[56px] w-full rounded-4 border border-line-2 bg-bg-1 px-6 text-base text-text-1 placeholder:text-text-2 outline-none transition-colors focus:border-primary',
                  errors.title && 'border-system-red focus:border-system-red',
                )}
              />
              {errors.title && (
                <span className="text-system-red mt-1 text-sm">{errors.title.message}</span>
              )}
            </FormField.Root>
            <FormField.Root className="flex flex-col gap-2">
              <FormField.Label className="text-text-1 font-medium">설명 (선택)</FormField.Label>
              <FormField.Control
                placeholder="이 스위트에 대한 간략한 설명을 입력해주세요."
                type="text"
                disabled={isPending}
                {...register('description')}
                className="h-[56px] w-full rounded-4 border border-line-2 bg-bg-1 px-6 text-base text-text-1 placeholder:text-text-2 outline-none transition-colors focus:border-primary"
              />
            </FormField.Root>
          </div>
          <div className="border-line-1 flex gap-3 border-t pt-6">
            <DSButton
              type="button"
              variant="ghost"
              className="w-full"
              disabled={isPending}
              onClick={onClose}
            >
              취소
            </DSButton>
            <DSButton
              type="submit"
              variant="solid"
              className="w-full"
              disabled={isPending}
            >
              {isPending ? '수정 중...' : '수정'}
            </DSButton>
          </div>
        </form>
      </div>
    </section>
  );
};
