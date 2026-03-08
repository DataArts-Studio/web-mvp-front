'use client';
import React from 'react';
import { useForm } from 'react-hook-form';

import type { CreateTestCase } from '@/entities/test-case';
import { BasicInfoFields, TagsField, ScenarioFields } from '@/entities/test-case';
import { projectTagsQueryOptions } from '@/entities/test-case/api';
import { useCreateCase } from '@/features/cases-create/hooks';
import { DSButton } from '@/shared';
import { TESTCASE_EVENTS, track } from '@/shared/lib/analytics';
import { testSuitesQueryOptions } from '@/widgets';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const CreateTestCaseFormSchema = z.object({
  projectId: z.string().uuid(),
  testSuiteId: z.string().uuid().nullable().optional(),
  title: z.string().min(1, '테스트 케이스 제목을 입력해주세요.'),
  testType: z.string().optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  preCondition: z.string().optional(),
  testSteps: z.string().optional(),
  expectedResult: z.string().optional(),
});

type CreateTestCaseForm = z.infer<typeof CreateTestCaseFormSchema>;

interface TestCaseDetailFormProps {
  projectId: string;
  onClose: () => void;
  onSuccess?: () => void;
  defaultSuiteId?: string;
}

export const TestCaseDetailForm = ({ projectId, onClose, onSuccess, defaultSuiteId }: TestCaseDetailFormProps) => {
  const { mutate } = useCreateCase();

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
      testSuiteId: defaultSuiteId ?? null,
      title: '',
      testType: '',
      tags: [],
      preCondition: '',
      testSteps: '',
      expectedResult: '',
    },
  });

  const onSubmit = handleSubmit((data) => {
    const payload: CreateTestCase = {
      ...data,
      testSuiteId: data.testSuiteId || undefined,
      tags: data.tags?.length ? data.tags : undefined,
    };

    // optimistic update로 즉시 반영 → 폼 바로 닫기
    track(TESTCASE_EVENTS.CREATE_COMPLETE, { project_id: projectId });
    onSuccess?.();
    onClose();

    mutate(payload, {
      onError: (error) => {
        track(TESTCASE_EVENTS.CREATE_FAIL, { project_id: projectId });
        toast.error(error.message || '테스트 케이스 생성에 실패했습니다.');
      },
    });
  });

  const handleAbandon = () => {
    track(TESTCASE_EVENTS.CREATE_ABANDON, { project_id: projectId });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleAbandon}
    >
      <section
        className="bg-bg-2 border border-line-2 rounded-5 relative flex max-h-[85vh] w-full max-w-[900px] flex-col overflow-hidden shadow-4"
        onClick={(e) => e.stopPropagation()}
      >
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

          <BasicInfoFields
            register={register}
            control={control}
            errors={errors}
            watch={watch}
            setValue={setValue}
            suites={suites}
          />

          <div className="border-t border-line-2" />

          <TagsField control={control} projectTags={projectTags} />

          <div className="border-t border-line-2" />

          <ScenarioFields control={control} />
        </form>

        {/* Actions - 스크롤 영역 밖 */}
        <div className="border-line-2 flex shrink-0 justify-end gap-3 border-t px-6 py-4">
          <DSButton type="button" variant="ghost" onClick={handleAbandon}>
            취소
          </DSButton>
          <DSButton type="submit" form="test-case-form" variant="solid">
            테스트 케이스 생성
          </DSButton>
        </div>
      </section>
    </div>
  );
};
