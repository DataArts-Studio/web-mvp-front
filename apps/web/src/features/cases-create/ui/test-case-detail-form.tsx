'use client';
import React, { useEffect, useId, useRef } from 'react';
import { useForm } from 'react-hook-form';

import { useTranslations } from 'next-intl';

import type { CreateTestCase } from '@/entities/test-case';
import { BasicInfoFields, ScenarioFields, TagsField } from '@/entities/test-case';
import { projectTagsQueryOptions } from '@/entities/test-case/api';
import { translateCaseErrors } from '@/entities/test-case/lib/translate-message';
import { useCreateCase } from '@/features/cases-create/hooks';
import { DSButton } from '@/shared';
import { TESTCASE_EVENTS, track } from '@/shared/lib/analytics';
import { testSuitesQueryOptions } from '@/widgets';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const createTestCaseFormSchema = (titleRequiredMessage: string) =>
  z.object({
    projectId: z.string().uuid(),
    testSuiteId: z.string().uuid().nullable().optional(),
    title: z.string().min(1, titleRequiredMessage),
    testType: z.string().optional(),
    tags: z.array(z.string().max(30)).max(10).optional(),
    preCondition: z.string().optional(),
    testSteps: z.string().optional(),
    expectedResult: z.string().optional(),
  });

type CreateTestCaseForm = z.infer<ReturnType<typeof createTestCaseFormSchema>>;

interface TestCaseDetailFormProps {
  projectId: string;
  onClose: () => void;
  onSuccess?: () => void;
  defaultSuiteId?: string;
}

export const TestCaseDetailForm = ({
  projectId,
  onClose,
  onSuccess,
  defaultSuiteId,
}: TestCaseDetailFormProps) => {
  const t = useTranslations('cases');
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
    resolver: zodResolver(createTestCaseFormSchema(t('ui.titleRequired'))),
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
        toast.error(translateCaseErrors(t, error.message) || t('ui.createFailedFallback'));
      },
    });
  });

  const handleAbandon = () => {
    track(TESTCASE_EVENTS.CREATE_ABANDON, { project_id: projectId });
    onClose();
  };

  const dialogRef = useRef<HTMLElement>(null);
  const titleId = useId();

  // 모달 a11y: 진입 시 포커스 이동, 닫을 때 트리거로 포커스 복귀,
  // ESC 닫기, Tab 포커스 트랩(모달 밖으로 못 나가게).
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const node = dialogRef.current;
    node?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        handleAbandon();
        return;
      }
      if (e.key !== 'Tab' || !node) return;
      const focusables = node.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    node?.addEventListener('keydown', handleKeyDown);
    return () => {
      node?.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus?.();
    };
    // 마운트/언마운트 시 1회만 (handleAbandon 은 안정적)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleAbandon}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="bg-bg-2 border-line-2 rounded-5 shadow-4 relative flex max-h-[85vh] w-full max-w-[900px] flex-col overflow-hidden border outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="border-line-2 flex shrink-0 items-center justify-between border-b px-6 py-5">
          <div>
            <h2 id={titleId} className="text-text-1 typo-h2-heading">
              {t('ui.createCase')}
            </h2>
            <p className="text-text-3 typo-caption-normal mt-0.5">{t('ui.createSubtitle')}</p>
          </div>
          <DSButton
            variant="ghost"
            size="small"
            onClick={handleAbandon}
            className="p-2"
            aria-label={t('ui.close')}
          >
            <X className="h-5 w-5" aria-hidden="true" />
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

          <div className="border-line-2 border-t" />

          <TagsField control={control} projectTags={projectTags} />

          <div className="border-line-2 border-t" />

          <ScenarioFields control={control} />
        </form>

        {/* Actions - 스크롤 영역 밖 */}
        <div className="border-line-2 flex shrink-0 justify-end gap-3 border-t px-6 py-4">
          <DSButton type="button" variant="ghost" onClick={handleAbandon}>
            {t('ui.cancel')}
          </DSButton>
          <DSButton type="submit" form="test-case-form" variant="solid">
            {t('ui.createCase')}
          </DSButton>
        </div>
      </section>
    </div>
  );
};
