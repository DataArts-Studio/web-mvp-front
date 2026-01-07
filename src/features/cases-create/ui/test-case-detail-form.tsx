'use client';
import React from 'react';

import { CreateTestCaseDtoSchema } from '@/entities/test-case';
import { useCreateCase } from '@/features/cases-create/hooks';
import { cn, DSButton, FormField } from '@/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, ListChecks, Tag, TestTube2, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

type CreateTestCaseDto = z.infer<typeof CreateTestCaseDtoSchema>;

interface TestCaseDetailFormProps {
  projectId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const TestCaseDetailForm = ({ projectId, onClose, onSuccess }: TestCaseDetailFormProps) => {
  const { mutate, isPending } = useCreateCase();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTestCaseDto>({
    resolver: zodResolver(CreateTestCaseDtoSchema),
    defaultValues: {
      project_id: projectId,
      name: '',
      test_type: '',
      tags: [],
      pre_condition: '',
      steps: '',
      expected_result: '',
    },
  });

  const onSubmit = (data: CreateTestCaseDto) => {
    mutate(data, {
      onSuccess: () => {
        onSuccess?.();
        onClose();
      },
    });
  };

  const inputClassName =
    'bg-bg-3 border-line-2 rounded-2 w-full border px-4 py-3 text-text-1 placeholder:text-text-3 focus:border-primary focus:outline-none transition-colors';
  const textareaClassName =
    'bg-bg-3 border-line-2 rounded-2 w-full border px-4 py-3 text-text-1 placeholder:text-text-3 focus:border-primary focus:outline-none transition-colors resize-none min-h-[120px]';
  const labelClassName = 'text-text-2 typo-body2-heading flex items-center gap-2';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <section className="bg-bg-1 rounded-4 flex w-full max-w-[720px] flex-col overflow-hidden shadow-xl">
        {/* Header */}
        <header className="border-line-2 flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-text-1 text-xl font-bold">테스트 케이스 생성</h2>
            <p className="text-text-3 mt-1 text-sm">
              테스트 시나리오의 상세 내용을 작성해주세요.
            </p>
          </div>
          <DSButton variant="ghost" size="small" onClick={onClose} className="p-2">
            <X className="h-5 w-5" />
          </DSButton>
        </header>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 p-6" noValidate>
          {/* 제목 (필수) */}
          <FormField.Root error={errors.name} className="flex flex-col gap-2">
            <FormField.Label className={labelClassName}>
              <FileText className="h-4 w-4" />
              테스트 케이스 제목 <span className="text-system-red">*</span>
            </FormField.Label>
            <FormField.Control
              {...register('name')}
              placeholder="예: 회원가입 - 이메일 형식이 잘못된 경우"
              className={cn(inputClassName, errors.name && 'border-system-red')}
            />
            {errors.name && (
              <span className="text-system-red text-sm">{errors.name.message}</span>
            )}
          </FormField.Root>

          {/* 테스트 타입 */}
          <FormField.Root className="flex flex-col gap-2">
            <FormField.Label className={labelClassName}>
              <TestTube2 className="h-4 w-4" />
              테스트 종류
            </FormField.Label>
            <FormField.Control
              {...register('test_type')}
              placeholder="예: 기능 테스트, UI 테스트, API 테스트"
              className={inputClassName}
            />
          </FormField.Root>

          {/* 태그 */}
          <FormField.Root className="flex flex-col gap-2">
            <FormField.Label className={labelClassName}>
              <Tag className="h-4 w-4" />
              태그
            </FormField.Label>
            <FormField.Control
              {...register('tags')}
              placeholder="쉼표로 구분하여 입력 (예: smoke, critical-path, regression)"
              className={inputClassName}
            />
            <span className="text-text-3 text-xs">쉼표(,)로 구분하여 여러 태그를 입력할 수 있습니다.</span>
          </FormField.Root>

          {/* 사전 조건 */}
          <FormField.Root className="flex flex-col gap-2">
            <FormField.Label className={labelClassName}>
              <ListChecks className="h-4 w-4" />
              사전 조건 (Preconditions)
            </FormField.Label>
            <textarea
              {...register('pre_condition')}
              placeholder="테스트 실행 전 충족되어야 하는 조건을 작성해주세요."
              className={textareaClassName}
              rows={3}
            />
          </FormField.Root>

          {/* 테스트 단계 */}
          <FormField.Root className="flex flex-col gap-2">
            <FormField.Label className={labelClassName}>
              <ListChecks className="h-4 w-4" />
              테스트 단계 (Test Steps)
            </FormField.Label>
            <textarea
              {...register('steps')}
              placeholder="1. 첫 번째 단계&#10;2. 두 번째 단계&#10;3. 세 번째 단계"
              className={textareaClassName}
              rows={4}
            />
          </FormField.Root>

          {/* 기대 결과 */}
          <FormField.Root className="flex flex-col gap-2">
            <FormField.Label className={labelClassName}>
              <ListChecks className="h-4 w-4" />
              기대 결과 (Expected Results)
            </FormField.Label>
            <textarea
              {...register('expected_result')}
              placeholder="각 테스트 단계 수행 후 예상되는 결과를 작성해주세요."
              className={textareaClassName}
              rows={4}
            />
          </FormField.Root>

          {/* Actions */}
          <div className="border-line-2 flex justify-end gap-3 border-t pt-6">
            <DSButton type="button" variant="ghost" onClick={onClose} disabled={isPending}>
              취소
            </DSButton>
            <DSButton type="submit" variant="solid" disabled={isPending}>
              {isPending ? '생성 중...' : '테스트 케이스 생성'}
            </DSButton>
          </div>
        </form>
      </section>
    </div>
  );
};