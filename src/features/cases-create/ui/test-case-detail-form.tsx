'use client';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';

import type { CreateTestCase } from '@/entities/test-case';
import { TEST_TYPE_OPTIONS } from '@/entities/test-case';
import { projectTagsQueryOptions } from '@/entities/test-case/api';
import { useCreateCase } from '@/features/cases-create/hooks';
import { DSButton, DsFormField, DsInput, DsSelect, TagChipInput, LoadingSpinner } from '@/shared';
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
  tags: z.array(z.string().max(30)).max(10).default([]),
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

  const { data: tagsData } = useQuery(projectTagsQueryOptions(projectId));
  const projectTags = tagsData?.success ? tagsData.data : [];

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    control,
  } = useForm<CreateTestCaseForm>({
    resolver: zodResolver(CreateTestCaseFormSchema),
    defaultValues: {
      projectId: projectId,
      testSuiteId: null,
      title: '',
      testType: '',
      tags: [],
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
      tags: data.tags.length > 0 ? data.tags : undefined,
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

  const textareaClassName =
    'w-full rounded-4 border border-line-2 bg-bg-1 px-6 py-4 text-base text-text-1 placeholder:text-text-2 outline-none transition-colors focus:border-primary resize-none min-h-[120px]';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleAbandon}
    >
      <section
        className="bg-bg-2 border border-line-2 rounded-5 relative flex max-h-[85vh] w-full max-w-[560px] flex-col overflow-hidden shadow-4"
        onClick={(e) => e.stopPropagation()}
      >
        {isPending && (
          <div className="rounded-5 bg-bg-2/80 absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm">
            <LoadingSpinner size="md" text="테스트 케이스를 생성하고 있어요" />
          </div>
        )}
        {/* Header */}
        <header className="border-line-2 flex shrink-0 items-center justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-text-1 typo-h2-heading">테스트 케이스 생성</h2>
            <p className="text-text-3 typo-caption-normal mt-0.5">
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
          className="flex flex-1 flex-col gap-6 overflow-y-auto p-6"
          noValidate
        >
          <input type="hidden" {...register('projectId')} />

          {/* ── 기본 정보 ── */}
          <fieldset className="flex flex-col gap-5">
            <legend className="typo-caption-heading text-text-3 mb-1 uppercase tracking-widest">
              기본 정보
            </legend>

            {/* 제목 (필수) */}
            <DsFormField.Root error={errors.title}>
              <DsFormField.Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                테스트 케이스 제목 <span className="text-system-red">*</span>
              </DsFormField.Label>
              <DsFormField.Control asChild>
                <DsInput
                  {...register('title')}
                  variant={errors.title ? 'error' : 'default'}
                  placeholder="예: 회원가입 - 이메일 형식이 잘못된 경우"
                />
              </DsFormField.Control>
              <DsFormField.Message />
            </DsFormField.Root>

            {/* 소속 스위트 */}
            <DsFormField.Root>
              <DsFormField.Label className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                소속 스위트
              </DsFormField.Label>
              <DsSelect
                className='w-full'
                value={selectedSuiteId || ''}
                onChange={(v) => setValue('testSuiteId', v || null)}
                options={[
                  { value: '', label: '스위트 없음' },
                  ...suites.map((suite) => ({ value: suite.id, label: suite.title })),
                ]}
                placeholder="스위트를 선택하세요"
              />
              <span className="text-text-3 typo-caption-normal">테스트 케이스가 속할 스위트를 선택하세요.</span>
            </DsFormField.Root>

            {/* 테스트 유형 */}
            <DsFormField.Root>
              <DsFormField.Label className="flex items-center gap-2">
                <TestTube2 className="h-4 w-4" />
                테스트 유형
              </DsFormField.Label>
              <Controller
                name="testType"
                control={control}
                render={({ field }) => (
                  <DsSelect
                    className="w-full"
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    options={[
                      { value: '', label: '선택 안 함' },
                      ...TEST_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
                    ]}
                    placeholder="테스트 유형을 선택하세요"
                  />
                )}
              />
            </DsFormField.Root>
          </fieldset>

          <div className="border-t border-line-2" />

          {/* ── 분류 ── */}
          <fieldset className="flex flex-col gap-5">
            <legend className="typo-caption-heading text-text-3 mb-1 uppercase tracking-widest">
              분류
            </legend>

            {/* 태그 */}
            <DsFormField.Root>
              <DsFormField.Label className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                태그
              </DsFormField.Label>
              <Controller
                name="tags"
                control={control}
                render={({ field }) => (
                  <TagChipInput
                    className="w-full"
                    value={field.value}
                    onChange={field.onChange}
                    suggestions={projectTags}
                    placeholder="태그 입력 후 Enter (예: smoke)"
                  />
                )}
              />
              <span className="text-text-3 typo-caption-normal">
                Enter로 태그를 추가하고, 쉼표(,)로 여러 태그를 한 번에 입력할 수 있습니다.
              </span>
            </DsFormField.Root>
          </fieldset>

          <div className="border-t border-line-2" />

          {/* ── 테스트 시나리오 ── */}
          <fieldset className="flex flex-col gap-5">
            <legend className="typo-caption-heading text-text-3 mb-1 uppercase tracking-widest">
              테스트 시나리오
            </legend>

            {/* 사전 조건 */}
            <DsFormField.Root>
              <DsFormField.Label className="flex items-center gap-2">
                <ListChecks className="h-4 w-4" />
                사전 조건 (Preconditions)
              </DsFormField.Label>
              <textarea
                {...register('preCondition')}
                placeholder="테스트 실행 전 충족되어야 하는 조건을 작성해주세요."
                className={textareaClassName}
                rows={2}
              />
            </DsFormField.Root>

            {/* 테스트 단계 */}
            <DsFormField.Root>
              <DsFormField.Label className="flex items-center gap-2">
                <ListChecks className="h-4 w-4" />
                테스트 단계 (Test Steps)
              </DsFormField.Label>
              <textarea
                {...register('testSteps')}
                placeholder="1. 첫 번째 단계&#10;2. 두 번째 단계&#10;3. 세 번째 단계"
                className={textareaClassName}
                rows={3}
              />
            </DsFormField.Root>

            {/* 기대 결과 */}
            <DsFormField.Root>
              <DsFormField.Label className="flex items-center gap-2">
                <ListChecks className="h-4 w-4" />
                기대 결과 (Expected Results)
              </DsFormField.Label>
              <textarea
                {...register('expectedResult')}
                placeholder="각 테스트 단계 수행 후 예상되는 결과를 작성해주세요."
                className={textareaClassName}
                rows={3}
              />
            </DsFormField.Root>
          </fieldset>
        </form>

        {/* Actions - 스크롤 영역 밖 */}
        <div className="border-line-2 flex shrink-0 justify-end gap-3 border-t px-6 py-4">
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
