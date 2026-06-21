'use client';
import React from 'react';
import { useForm } from 'react-hook-form';

import { useTranslations } from 'next-intl';

import {
  BasicInfoFields,
  ScenarioFields,
  TEST_TYPE_OPTIONS,
  TagsField,
} from '@/entities/test-case';
import type { TestCase } from '@/entities/test-case';
import { projectTagsQueryOptions } from '@/entities/test-case/api';
import { translateCaseErrors } from '@/entities/test-case/lib/translate-message';
import { DSButton } from '@/shared';
import { TESTCASE_EVENTS, track } from '@/shared/lib/analytics';
import { testSuitesQueryOptions } from '@/widgets';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { toast } from 'sonner';

import { useUpdateCase } from '../hooks';
import { UpdateTestCase, createUpdateTestCaseSchema } from '../model';

interface TestCaseEditFormProps {
  testCase: TestCase;
  onClose: () => void;
  onSuccess?: () => void;
}

export const TestCaseEditForm = ({ testCase, onClose, onSuccess }: TestCaseEditFormProps) => {
  const t = useTranslations('cases');
  const { mutate } = useUpdateCase();

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
    resolver: zodResolver(
      createUpdateTestCaseSchema({
        titleMin: t('ui.titleMin'),
        titleMax: t('ui.titleMax'),
      })
    ),
    defaultValues: {
      id: testCase.id,
      title: testCase.title,
      testSuiteId: testCase.testSuiteId || null,
      testType:
        testCase.testType && TEST_TYPE_OPTIONS.some((o) => o.value === testCase.testType)
          ? testCase.testType
          : testCase.testType
            ? 'other'
            : '',
      tags: testCase.tags ?? [],
      preCondition: testCase.preCondition,
      testSteps: testCase.testSteps,
      expectedResult: testCase.expectedResult,
    },
  });

  const onSubmit = (data: UpdateTestCase) => {
    // optimistic update로 즉시 반영 → 폼 바로 닫기
    track(TESTCASE_EVENTS.UPDATE, { case_id: testCase.id });
    onSuccess?.();
    onClose();

    mutate(
      { ...data, projectId: testCase.projectId },
      {
        onError: (error) => {
          track(TESTCASE_EVENTS.UPDATE_FAIL, { case_id: testCase.id });
          toast.error(translateCaseErrors(t, error.message) || t('ui.updateFailedFallback'));
        },
      }
    );
  };

  const handleAbandon = () => {
    track(TESTCASE_EVENTS.UPDATE_ABANDON, { case_id: testCase.id });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleAbandon}
    >
      <section
        className="bg-bg-2 border-line-2 rounded-5 shadow-4 relative flex max-h-[85vh] w-full max-w-[900px] flex-col overflow-hidden border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="border-line-2 flex shrink-0 items-center justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-text-1 typo-h2-heading">{t('ui.editCase')}</h2>
            <p className="text-text-3 typo-caption-normal mt-0.5">{t('ui.editSubtitle')}</p>
          </div>
          <DSButton
            variant="ghost"
            size="small"
            onClick={handleAbandon}
            className="p-2"
            aria-label={t('ui.close')}
          >
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

          <BasicInfoFields
            register={register}
            control={control}
            errors={errors}
            watch={watch}
            setValue={setValue}
            suites={suites}
          />

          <div className="border-line-2 border-t" />

          <TagsField control={control} projectTags={projectTags} />

          <div className="border-line-2 border-t" />

          <ScenarioFields control={control} />

          {/* Actions */}
          <div className="border-line-2 flex justify-end gap-3 border-t pt-6">
            <DSButton type="button" variant="ghost" onClick={handleAbandon}>
              {t('ui.cancel')}
            </DSButton>
            <DSButton type="submit" variant="solid">
              {t('ui.editCase')}
            </DSButton>
          </div>
        </form>
      </section>
    </div>
  );
};
