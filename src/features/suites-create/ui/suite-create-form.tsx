'use client';
import React from 'react';
import { useForm } from 'react-hook-form';

import { CreateTestSuite, CreateTestSuiteSchema, createTestSuite } from '@/entities';
import { useCreateSuite } from '@/features';
import { DSButton, FormField } from '@/shared';
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
      className="bg-bg-2/20 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-[4px]"
    >
      <div className="bg-bg-2 shadow-4 w-[600px] overflow-hidden rounded-xl p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8" noValidate>
          {/* Header */}
          <div className="border-line-1 border-b pb-6">
            <h2 className="text-primary text-3xl">테스트 스위트를 만들어 볼까요?</h2>
            <p className="mt-2 text-base text-neutral-400">
              필요한 테스트들을 한 곳에 모아 관리해요
            </p>
          </div>
          {/* Body */}
          <div className="flex flex-col gap-6">
            <FormField.Root className="flex flex-col gap-2">
              <FormField.Label className="text-text-1 font-medium">
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
              {/* 에러 메시지 출력 */}
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
              {isPending ? '생성 중...' : '생성'}
            </DSButton>
          </div>
        </form>
      </div>
    </section>
  );
};
