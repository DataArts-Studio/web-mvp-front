'use client';
import React from 'react';
import { useForm } from 'react-hook-form';

import type { CreateTestCase } from '@/entities/test-case';
import { useCreateCase } from '@/features/cases-create/hooks';
import { DSButton, DsFormField, DsInput, LoadingSpinner, cn } from '@/shared';
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
  const tagsValue = watch('tags');
  const tagList = tagsValue?.split(',').map((t) => t.trim()).filter(Boolean) ?? [];

  const [tagInput, setTagInput] = React.useState('');

  const addTags = (input: string) => {
    const newTags = input.split(',').map((t) => t.trim()).filter(Boolean);
    if (newTags.length === 0) return;
    const merged = [...new Set([...tagList, ...newTags])];
    setValue('tags', merged.join(', '));
    setTagInput('');
  };

  const removeTag = (target: string) => {
    setValue('tags', tagList.filter((t) => t !== target).join(', '));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTags(tagInput);
    }
  };

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
              <select
                value={selectedSuiteId || ''}
                onChange={(e) => setValue('testSuiteId', e.target.value || null)}
                className={cn(
                  'h-[56px] w-full cursor-pointer rounded-4 border border-line-2 bg-bg-1 px-6 text-base text-text-1 placeholder:text-text-2 outline-none transition-colors focus:border-primary',
                )}
              >
                <option value="">스위트 없음</option>
                {suites.map((suite) => (
                  <option key={suite.id} value={suite.id}>
                    {suite.title}
                  </option>
                ))}
              </select>
              <span className="text-text-3 typo-caption-normal">테스트 케이스가 속할 스위트를 선택하세요.</span>
            </DsFormField.Root>

            {/* 테스트 유형 */}
            <DsFormField.Root>
              <DsFormField.Label className="flex items-center gap-2">
                <TestTube2 className="h-4 w-4" />
                테스트 유형
              </DsFormField.Label>
              <DsFormField.Control asChild>
                <DsInput
                  {...register('testType')}
                  placeholder="예: 기능 테스트, UI 테스트, API 테스트"
                />
              </DsFormField.Control>
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
              <DsFormField.Control asChild>
                <DsInput
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="태그 입력 후 Enter (예: smoke)"
                />
              </DsFormField.Control>
              <span className="text-text-3 typo-caption-normal">
                Enter로 태그를 추가하고, 쉼표(,)로 여러 태그를 한 번에 입력할 수 있습니다.
              </span>
              {tagList.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {tagList.map((tag) => (
                    <li
                      key={tag}
                      className="inline-flex items-center gap-1.5 rounded-full border border-line-2 bg-bg-3 py-1 pl-3 pr-1.5"
                    >
                      <span className="typo-caption-normal text-text-2">{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="flex h-4 w-4 items-center justify-center rounded-full text-text-3 transition-colors hover:bg-bg-4 hover:text-text-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
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
