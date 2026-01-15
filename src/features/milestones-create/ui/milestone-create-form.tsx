'use client';
import React from 'react';
import { useForm } from 'react-hook-form';

import { CreateMilestone, CreateMilestoneSchema } from '@/entities/milestone';
import { DSButton, FormField } from '@/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateMilestone } from '@/features';


interface MilestoneCreateFormProps {
  projectId: string;
  onClose?: () => void;
}

export const MilestoneCreateForm = ({ projectId, onClose }: MilestoneCreateFormProps) => {
  const { mutate, isPending } = useCreateMilestone();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateMilestone>({
    resolver: zodResolver(CreateMilestoneSchema),
    defaultValues: {
      projectId,
      title: '',
      description: '',
      startDate: null,
      endDate: null,
    },
  });

  const onSubmit = async (data: CreateMilestone) => {
    mutate(data, {
      onSuccess: () => {
        onClose?.();
      },
    });
  };

  return (
    <section
      id="create-milestone"
      className="bg-bg-2/20 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-[4px]"
    >
      <div className="bg-bg-2 shadow-4 w-[600px] overflow-hidden rounded-xl p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8" noValidate>
          {/* Header */}
          <div className="border-line-1 border-b pb-6">
            <h2 className="text-primary text-3xl">마일스톤을 만들어 볼까요?</h2>
            <p className="mt-2 text-base text-neutral-400">
              프로젝트의 중요한 목표 지점을 설정하고 한곳에서 관리해요.
            </p>
          </div>

          {/* Body */}
          <div className="flex flex-col gap-6">
            <FormField.Root className="flex flex-col gap-2">
              <FormField.Label className="text-text-1 font-medium">
                마일스톤 이름 <span className="text-system-red">*</span>
              </FormField.Label>
              <FormField.Control
                placeholder="마일스톤 이름을 입력해 주세요."
                type="text"
                maxLength={50}
                disabled={isPending}
                {...register('title')}
                className={errors.title ? 'border-system-red focus:border-system-red' : ''}
              />
              {errors.title && (
                <span className="text-system-red mt-1 text-sm">{errors.title.message}</span>
              )}
            </FormField.Root>

            <FormField.Root className="flex flex-col gap-2">
              <FormField.Label className="text-text-1 font-medium">설명 (선택)</FormField.Label>
              <FormField.Control
                placeholder="이 마일스톤에 대한 간략한 설명을 입력해주세요."
                type="text"
                maxLength={500}
                disabled={isPending}
                {...register('description')}
                className={errors.description ? 'border-system-red focus:border-system-red' : ''}
              />
              {errors.description && (
                <span className="text-system-red mt-1 text-sm">{errors.description.message}</span>
              )}
            </FormField.Root>

            <div className="grid grid-cols-2 gap-4">
              <FormField.Root className="flex flex-col gap-2">
                <FormField.Label className="text-text-1 font-medium">시작일</FormField.Label>
                <FormField.Control
                  type="date"
                  disabled={isPending}
                  {...register('startDate', { valueAsDate: true })}
                />
                {errors.startDate && (
                  <span className="text-system-red mt-1 text-sm">{errors.startDate.message}</span>
                )}
              </FormField.Root>

              <FormField.Root className="flex flex-col gap-2">
                <FormField.Label className="text-text-1 font-medium">종료일</FormField.Label>
                <FormField.Control
                  type="date"
                  disabled={isPending}
                  {...register('endDate', { valueAsDate: true })}
                />
                {errors.endDate && (
                  <span className="text-system-red mt-1 text-sm">{errors.endDate.message}</span>
                )}
              </FormField.Root>
            </div>
          </div>

          {/* Footer */}
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
