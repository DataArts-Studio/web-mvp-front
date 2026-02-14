'use client';
import React from 'react';

import { TestCase, TEST_TYPE_OPTIONS } from '@/entities/test-case';
import { projectTagsQueryOptions } from '@/entities/test-case/api';
import { testSuitesQueryOptions } from '@/widgets';
import { DSButton, DsFormField, DsInput, DsSelect, TagChipInput, LoadingSpinner } from '@/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, FolderOpen, ListChecks, Tag, TestTube2, X } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { useUpdateCase } from '../hooks';
import { UpdateTestCase, UpdateTestCaseSchema } from '../model';
import { track, TESTCASE_EVENTS } from '@/shared/lib/analytics';

interface TestCaseEditFormProps {
  testCase: TestCase;
  onClose: () => void;
  onSuccess?: () => void;
}

export const TestCaseEditForm = ({ testCase, onClose, onSuccess }: TestCaseEditFormProps) => {
  const { mutate, isPending } = useUpdateCase();

  const { data: suitesData } = useQuery({
    ...testSuitesQueryOptions(testCase.projectId),
    enabled: !!testCase.projectId,
  });
  const suites = suitesData?.success ? suitesData.data : [];

  const { data: tagsData } = useQuery(projectTagsQueryOptions(testCase.projectId));
  const projectTags = tagsData?.success ? tagsData.data : [];

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    control,
  } = useForm({
    resolver: zodResolver(UpdateTestCaseSchema),
    defaultValues: {
      id: testCase.id,
      title: testCase.title,
      testSuiteId: testCase.testSuiteId || null,
      testType: testCase.testType && TEST_TYPE_OPTIONS.some((o) => o.value === testCase.testType)
        ? testCase.testType
        : testCase.testType ? 'other' : '',
      tags: testCase.tags ?? [],
      preCondition: testCase.preCondition,
      testSteps: testCase.testSteps,
      expectedResult: testCase.expectedResult,
    },
  });

  const selectedSuiteId = watch('testSuiteId');

  const onSubmit = (data: UpdateTestCase) => {
    mutate(data, {
      onSuccess: () => {
        track(TESTCASE_EVENTS.UPDATE, { case_id: testCase.id });
        onSuccess?.();
        onClose();
      },
      onError: () => {
        track(TESTCASE_EVENTS.UPDATE_FAIL, { case_id: testCase.id });
      },
    });
  };

  const handleAbandon = () => {
    track(TESTCASE_EVENTS.UPDATE_ABANDON, { case_id: testCase.id });
    onClose();
  };

  const textareaClassName =
    'w-full rounded-4 border border-line-2 bg-bg-1 px-6 py-4 text-base text-text-1 placeholder:text-text-2 outline-none transition-colors focus:border-primary resize-none min-h-[120px]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleAbandon}>
      <section
        className="bg-bg-2 border border-line-2 rounded-5 relative flex max-h-[85vh] w-full max-w-[560px] flex-col overflow-hidden shadow-4"
        onClick={(e) => e.stopPropagation()}
      >
        {isPending && (
          <div className="rounded-5 bg-bg-2/80 absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm">
            <LoadingSpinner size="md" text="테스트 케이스를 수정하고 있어요" />
          </div>
        )}
        {/* Header */}
        <header className="border-line-2 flex shrink-0 items-center justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-text-1 typo-h2-heading">테스트 케이스 수정</h2>
            <p className="text-text-3 typo-caption-normal mt-0.5">
              테스트 시나리오의 상세 내용을 수정해주세요.
            </p>
          </div>
          <DSButton variant="ghost" size="small" onClick={handleAbandon} className="p-2">
            <X className="h-5 w-5" />
          </DSButton>
        </header>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col gap-6 overflow-y-auto p-6"
          noValidate
        >
          <input type="hidden" {...register('id')} />

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
                className="w-full"
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

          {/* Actions */}
          <div className="border-line-2 flex justify-end gap-3 border-t pt-6">
            <DSButton type="button" variant="ghost" onClick={handleAbandon} disabled={isPending}>
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
