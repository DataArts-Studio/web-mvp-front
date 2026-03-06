'use client';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';

import type { TestCaseTemplate, UpdateTestCaseTemplate } from '@/entities/test-case-template';
import { TEST_TYPE_OPTIONS } from '@/entities/test-case';
import { useUpdateTemplate } from '../hooks';
import { DSButton, DsFormField, DsInput, DsSelect, TagChipInput, LoadingSpinner } from '@/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, ListChecks, Tag, TestTube2, X } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';

const UpdateTemplateFormSchema = z.object({
  id: z.string(),
  name: z.string().min(1, '템플릿 이름을 입력해주세요.').max(50, '템플릿 이름은 50자를 넘을 수 없습니다.'),
  description: z.string().max(200, '설명은 200자를 넘을 수 없습니다.').optional(),
  testType: z.string().optional(),
  defaultTags: z.array(z.string().max(30)).max(10).optional(),
  preCondition: z.string().optional(),
  testSteps: z.string().optional(),
  expectedResult: z.string().optional(),
});

type UpdateTemplateForm = z.infer<typeof UpdateTemplateFormSchema>;

interface TemplateEditModalProps {
  template: TestCaseTemplate;
  onClose: () => void;
  onSuccess?: () => void;
}

export const TemplateEditModal = ({ template, onClose, onSuccess }: TemplateEditModalProps) => {
  const { mutate, isPending } = useUpdateTemplate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<UpdateTemplateForm>({
    resolver: zodResolver(UpdateTemplateFormSchema),
    defaultValues: {
      id: template.id,
      name: template.name,
      description: template.description,
      testType: template.testType,
      defaultTags: template.defaultTags,
      preCondition: template.preCondition,
      testSteps: template.testSteps,
      expectedResult: template.expectedResult,
    },
  });

  const onSubmit = handleSubmit((data) => {
    const payload: UpdateTestCaseTemplate = {
      ...data,
      defaultTags: data.defaultTags?.length ? data.defaultTags : [],
    };
    mutate(payload, {
      onSuccess: () => {
        toast.success('템플릿이 수정되었습니다.');
        onSuccess?.();
        onClose();
      },
      onError: () => {
        toast.error('템플릿 수정에 실패했습니다.');
      },
    });
  });

  const textareaClassName =
    'w-full rounded-4 border border-line-2 bg-bg-1 px-6 py-4 text-base text-text-1 placeholder:text-text-2 outline-none transition-colors focus:border-primary resize-none min-h-[120px]';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <section
        className="bg-bg-2 border border-line-2 rounded-5 relative flex max-h-[85vh] w-full max-w-[560px] flex-col overflow-hidden shadow-4"
        onClick={(e) => e.stopPropagation()}
      >
        {isPending && (
          <div className="rounded-5 bg-bg-2/80 absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm">
            <LoadingSpinner size="md" text="템플릿을 수정하고 있어요" />
          </div>
        )}
        <header className="border-line-2 flex shrink-0 items-center justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-text-1 typo-h2-heading">템플릿 수정</h2>
            <p className="text-text-3 typo-caption-normal mt-0.5">
              템플릿의 내용을 수정하세요.
            </p>
          </div>
          <DSButton variant="ghost" size="small" onClick={onClose} className="p-2">
            <X className="h-5 w-5" />
          </DSButton>
        </header>

        <form
          id="template-edit-form"
          onSubmit={onSubmit}
          className="flex flex-1 flex-col gap-6 overflow-y-auto p-6"
          noValidate
        >
          <input type="hidden" {...register('id')} />

          <fieldset className="flex flex-col gap-5">
            <legend className="typo-caption-heading text-text-3 mb-1 uppercase tracking-widest">
              기본 정보
            </legend>

            <DsFormField.Root error={errors.name}>
              <DsFormField.Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                템플릿 이름 <span className="text-system-red">*</span>
              </DsFormField.Label>
              <DsFormField.Control asChild>
                <DsInput
                  {...register('name')}
                  variant={errors.name ? 'error' : 'default'}
                  placeholder="예: 로그인 기능 테스트 템플릿"
                />
              </DsFormField.Control>
              <DsFormField.Message />
            </DsFormField.Root>

            <DsFormField.Root error={errors.description}>
              <DsFormField.Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                설명
              </DsFormField.Label>
              <DsFormField.Control asChild>
                <DsInput
                  {...register('description')}
                  variant={errors.description ? 'error' : 'default'}
                  placeholder="템플릿에 대한 간단한 설명을 입력하세요."
                />
              </DsFormField.Control>
              <DsFormField.Message />
            </DsFormField.Root>

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

          <fieldset className="flex flex-col gap-5">
            <legend className="typo-caption-heading text-text-3 mb-1 uppercase tracking-widest">
              기본 태그
            </legend>
            <DsFormField.Root>
              <DsFormField.Label className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                태그
              </DsFormField.Label>
              <Controller
                name="defaultTags"
                control={control}
                render={({ field }) => (
                  <TagChipInput
                    className="w-full"
                    value={field.value ?? []}
                    onChange={field.onChange}
                    placeholder="태그 입력 후 Enter"
                  />
                )}
              />
            </DsFormField.Root>
          </fieldset>

          <div className="border-t border-line-2" />

          <fieldset className="flex flex-col gap-5">
            <legend className="typo-caption-heading text-text-3 mb-1 uppercase tracking-widest">
              기본 내용
            </legend>

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

            <DsFormField.Root>
              <DsFormField.Label className="flex items-center gap-2">
                <ListChecks className="h-4 w-4" />
                테스트 단계 (Test Steps)
              </DsFormField.Label>
              <textarea
                {...register('testSteps')}
                placeholder="1. 첫 번째 단계&#10;2. 두 번째 단계"
                className={textareaClassName}
                rows={3}
              />
            </DsFormField.Root>

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

        <div className="border-line-2 flex shrink-0 justify-end gap-3 border-t px-6 py-4">
          <DSButton type="button" variant="ghost" onClick={onClose} disabled={isPending}>
            취소
          </DSButton>
          <DSButton type="submit" form="template-edit-form" variant="solid" disabled={isPending}>
            {isPending ? '수정 중...' : '템플릿 수정'}
          </DSButton>
        </div>
      </section>
    </div>
  );
};
