'use client';
import React from 'react';
import { useForm } from 'react-hook-form';

import type { CreateTestCase } from '@/entities/test-case';
import { useCreateCase } from '@/features/cases-create/hooks';
import { DSButton, FormField, LoadingSpinner, cn } from '@/shared';
import { TESTCASE_EVENTS, track } from '@/shared/lib/analytics';
import { testSuitesQueryOptions } from '@/widgets';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { FileText, FolderOpen, ListChecks, Tag, TestTube2, X } from 'lucide-react';
import { z } from 'zod';

const CreateTestCaseFormSchema = z.object({
  projectId: z.string().uuid(),
  testSuiteId: z.string().uuid().nullable().optional(),
  title: z.string().min(1, '테스트 케이스 제목을 입력해주세요.'),
  testType: z.string().optional(),
  tags: z.string().optional(),
  preCondition: z.string().optional(),
  testSteps: z.string().optional(),
  expectedResult: z.string().optional(),
});

type CreateTestCaseForm = z.infer<typeof CreateTestCaseFormSchema>;

interface TestCaseDetailFormProps {
  projectId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const TestCaseDetailForm = ({ projectId, onClose, onSuccess }: TestCaseDetailFormProps) => {
  const { mutate, isPending } = useCreateCase();

  const { data: suitesData } = useQuery({
    ...testSuitesQueryOptions(projectId),
    enabled: !!projectId,
  });
  const suites = suitesData?.success ? suitesData.data : [];

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CreateTestCaseForm>({
    resolver: zodResolver(CreateTestCaseFormSchema),
    defaultValues: {
      projectId: projectId,
      testSuiteId: null,
      title: '',
      testType: '',
      tags: '',
      preCondition: '',
      testSteps: '',
      expectedResult: '',
    },
  });

  const selectedSuiteId = watch('testSuiteId');

  const onSubmit = handleSubmit((data) => {
    const payload: CreateTestCase = {
      ...data,
      testSuiteId: data.testSuiteId || undefined,
      tags: data.tags ? data.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : undefined,
    };
    mutate(payload, {
      onSuccess: () => {
        track(TESTCASE_EVENTS.CREATE_COMPLETE, { project_id: projectId });
        onSuccess?.();
        onClose();
      },
      onError: () => {
        track(TESTCASE_EVENTS.CREATE_FAIL, { project_id: projectId });
      },
    });
  });

  const handleAbandon = () => {
    track(TESTCASE_EVENTS.CREATE_ABANDON, { project_id: projectId });
    onClose();
  };

  const inputClassName =
    'h-[56px] w-full rounded-4 border border-line-2 bg-bg-1 px-6 text-base text-text-1 placeholder:text-text-2 outline-none transition-colors focus:border-primary';
  const textareaClassName =
    'w-full rounded-4 border border-line-2 bg-bg-1 px-6 py-4 text-base text-text-1 placeholder:text-text-2 outline-none transition-colors focus:border-primary resize-none min-h-[120px]';
  const labelClassName = 'text-text-2 typo-body2-heading flex items-center gap-2';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleAbandon}
    >
      <section
        className="bg-bg-1 rounded-4 relative flex max-h-[85vh] w-full max-w-[560px] flex-col overflow-hidden shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {isPending && (
          <div className="rounded-4 bg-bg-1/80 absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm">
            <LoadingSpinner size="md" text="테스트 케이스를 생성하고 있어요" />
          </div>
        )}
        {/* Header */}
        <header className="border-line-2 flex shrink-0 items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-text-1 text-lg font-bold">테스트 케이스 생성</h2>
            <p className="text-text-3 mt-0.5 text-xs">
              테스트 시나리오의 상세 내용을 작성해주세요.
            </p>
          </div>
          <DSButton variant="ghost" size="small" onClick={handleAbandon} className="p-2">
            <X className="h-5 w-5" />
          </DSButton>
        </header>

        {/* Form */}
        <form
          id="test-case-form"
          onSubmit={onSubmit}
          className="flex flex-1 flex-col gap-5 overflow-y-auto p-5"
          noValidate
        >
          <input type="hidden" {...register('projectId')} />
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

          {/* 소속 스위트 */}
          <FormField.Root className="flex flex-col gap-2">
            <FormField.Label className={labelClassName}>
              <FolderOpen className="h-4 w-4" />
              소속 스위트
            </FormField.Label>
            <select
              value={selectedSuiteId || ''}
              onChange={(e) => setValue('testSuiteId', e.target.value || null)}
              className={cn(inputClassName, 'cursor-pointer')}
            >
              <option value="">스위트 없음</option>
              {suites.map((suite) => (
                <option key={suite.id} value={suite.id}>
                  {suite.title}
                </option>
              ))}
            </select>
            <span className="text-text-3 text-xs">테스트 케이스가 속할 스위트를 선택하세요.</span>
          </FormField.Root>

          {/* 테스트 타입 */}
          <FormField.Root className="flex flex-col gap-2">
            <FormField.Label className={labelClassName}>
              <TestTube2 className="h-4 w-4" />
              테스트 상태
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
            <span className="text-text-3 text-xs">
              쉼표(,)로 구분하여 여러 태그를 입력할 수 있습니다.
            </span>
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
              rows={2}
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
              rows={3}
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
              rows={3}
            />
          </FormField.Root>
        </form>

        {/* Actions - 스크롤 영역 밖 */}
        <div className="border-line-2 flex shrink-0 justify-end gap-3 border-t px-5 py-4">
          <DSButton type="button" variant="ghost" onClick={handleAbandon} disabled={isPending}>
            취소
          </DSButton>
          <DSButton type="submit" form="test-case-form" variant="solid" disabled={isPending}>
            {isPending ? '생성 중...' : '테스트 케이스 생성'}
          </DSButton>
        </div>
      </section>
    </div>
  );
};
