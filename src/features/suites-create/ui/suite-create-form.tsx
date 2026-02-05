'use client';
import React from 'react';
import { useForm } from 'react-hook-form';

import { CreateTestSuite, CreateTestSuiteSchema, createTestSuite } from '@/entities';
import { useCreateSuite } from '@/features';
import { DSButton, FormField, LoadingSpinner } from '@/shared';
import { zodResolver } from '@hookform/resolvers/zod';

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
        onClose?.();
      },
    })
  };

  return (
    <section
      id="create-suite"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="bg-bg-2 shadow-4 relative flex max-h-[85vh] w-full max-w-[480px] flex-col overflow-hidden rounded-xl">
        {isPending && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-bg-2/80 backdrop-blur-sm">
            <LoadingSpinner size="md" text="테스트 스위트를 생성하고 있어요" />
          </div>
        )}
        {/* Header */}
        <div className="border-line-2 shrink-0 border-b px-6 py-5">
          <h2 className="text-text-1 text-lg font-bold">테스트 스위트 생성</h2>
          <p className="text-text-3 mt-1 text-sm">
            필요한 테스트들을 한 곳에 모아 관리해요
          </p>
        </div>

        {/* Body */}
        <form id="suite-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col gap-5 overflow-y-auto p-6" noValidate>
          <input type="hidden" {...register('projectId')} />
          <FormField.Root className="flex flex-col gap-2">
            <FormField.Label className="text-text-2 text-sm font-medium">
              스위트 이름 <span className="text-system-red">*</span>
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
              className={errors.title ? 'border-system-red focus:border-system-red' : ''}
            />
            {errors.title && (
              <span className="text-system-red text-sm">{errors.title.message}</span>
            )}
          </FormField.Root>
          <FormField.Root className="flex flex-col gap-2">
            <FormField.Label className="text-text-2 text-sm font-medium">설명 (선택)</FormField.Label>
            <FormField.Control
              placeholder="이 스위트에 대한 간략한 설명을 입력해주세요."
              type="text"
              disabled={isPending}
              {...register('description')}
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
            onClick={onClose}
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
