'use client';
import React from 'react';
import { useForm } from 'react-hook-form';

import { Milestone } from '@/entities/milestone';
import { DSButton, FormField } from '@/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUpdateMilestone } from '../hooks';
import { UpdateMilestone, UpdateMilestoneSchema } from '../model';

interface MilestoneEditFormProps {
  milestone: Milestone;
  onClose?: () => void;
}

const toDateTimeInputValue = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  // datetime-local 형식: YYYY-MM-DDTHH:mm
  return d.toISOString().slice(0, 16);
};

export const MilestoneEditForm = ({ milestone, onClose }: MilestoneEditFormProps) => {
  const { mutate, isPending } = useUpdateMilestone();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateMilestone>({
    resolver: zodResolver(UpdateMilestoneSchema),
    defaultValues: {
      id: milestone.id,
      title: milestone.title,
      description: milestone.description ?? '',
      startDate: toDateTimeInputValue(milestone.startDate),
      endDate: toDateTimeInputValue(milestone.endDate),
    },
  });

  const onSubmit = async (data: UpdateMilestone) => {
    mutate(data, {
      onSuccess: () => {
        onClose?.();
      },
    });
  };

  return (
    <section
      id="edit-milestone"
      className="bg-bg-2/20 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-[4px]"
    >
      <div className="bg-bg-2 shadow-4 w-[600px] overflow-hidden rounded-xl p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8" noValidate>
          {/* Header */}
          <div className="border-line-1 border-b pb-6">
            <h2 className="text-primary text-3xl">마일스톤 수정</h2>
            <p className="mt-2 text-base text-neutral-400">
              마일스톤의 이름, 설명, 날짜를 수정합니다.
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
                disabled={isPending}
                {...register('description')}
              />
            </FormField.Root>

            <div className="grid grid-cols-2 gap-4">
              <FormField.Root className="flex flex-col gap-2">
                <FormField.Label className="text-text-1 font-medium">시작일시</FormField.Label>
                <FormField.Control
                  type="datetime-local"
                  disabled={isPending}
                  {...register('startDate')}
                />
                {errors.startDate && (
                  <span className="text-system-red mt-1 text-sm">{errors.startDate.message}</span>
                )}
              </FormField.Root>

              <FormField.Root className="flex flex-col gap-2">
                <FormField.Label className="text-text-1 font-medium">종료일시</FormField.Label>
                <FormField.Control
                  type="datetime-local"
                  disabled={isPending}
                  {...register('endDate')}
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
              {isPending ? '수정 중...' : '수정'}
            </DSButton>
          </div>
        </form>
      </div>
    </section>
  );
};
