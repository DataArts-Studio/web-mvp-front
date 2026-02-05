'use client';
import React from 'react';

import { TestCase } from '@/entities/test-case';
import { cn, DSButton, FormField, LoadingSpinner } from '@/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, ListChecks, Tag, TestTube2, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useUpdateCase } from '../hooks';
import { UpdateTestCase, UpdateTestCaseSchema } from '../model';

interface TestCaseEditFormProps {
  testCase: TestCase;
  onClose: () => void;
  onSuccess?: () => void;
}

export const TestCaseEditForm = ({ testCase, onClose, onSuccess }: TestCaseEditFormProps) => {
  const { mutate, isPending } = useUpdateCase();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateTestCase>({
    resolver: zodResolver(UpdateTestCaseSchema),
    defaultValues: {
      id: testCase.id,
      title: testCase.title,
      testType: testCase.testType,
      tags: testCase.tags,
      preCondition: testCase.preCondition,
      testSteps: testCase.testSteps,
      expectedResult: testCase.expectedResult,
    },
  });

  const onSubmit = (data: UpdateTestCase) => {
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
      <section className="bg-bg-1 rounded-4 relative flex w-full max-w-[720px] flex-col overflow-hidden shadow-xl">
        {isPending && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-4 bg-bg-1/80 backdrop-blur-sm">
            <LoadingSpinner size="md" text="테스트 케이스를 수정하고 있어요" />
          </div>
        )}
        {/* Header */}
        <header className="border-line-2 flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-text-1 text-xl font-bold">테스트 케이스 수정</h2>
            <p className="text-text-3 mt-1 text-sm">
              테스트 시나리오의 상세 내용을 수정해주세요.
            </p>
          </div>
          <DSButton variant="ghost" size="small" onClick={onClose} className="p-2">
            <X className="h-5 w-5" />
          </DSButton>
        </header>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex max-h-[70vh] flex-col gap-6 overflow-y-auto p-6" noValidate>
          <input type="hidden" {...register('id')} />
          {/* 제목 (필수) */}
          <FormField.Root error={errors.title} className="flex flex-col gap-2">
            <FormField.Label className={labelClassName}>
              <FileText className="h-4 w-4" />
              테스트 케이스 제목 <span className="text-system-red">*</span>
            </FormField.Label>
            <FormField.Control
              {...register('title')}
              placeholder="예: 회원가입 - 이메일 형식이 잘못된 경우"
              className={cn(inputClassName, errors.title && 'border-system-red')}
            />
            {errors.title && (
              <span className="text-system-red text-sm">{errors.title.message}</span>
            )}
          </FormField.Root>

          {/* 테스트 타입 */}
          <FormField.Root className="flex flex-col gap-2">
            <FormField.Label className={labelClassName}>
              <TestTube2 className="h-4 w-4" />
              테스트 종류
            </FormField.Label>
            <FormField.Control
              {...register('testType')}
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
              {...register('preCondition')}
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
              {...register('testSteps')}
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
              {...register('expectedResult')}
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
              {isPending ? '수정 중...' : '테스트 케이스 수정'}
            </DSButton>
          </div>
        </form>
      </section>
    </div>
  );
};
