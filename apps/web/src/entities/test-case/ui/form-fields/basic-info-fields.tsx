'use client';
import React from 'react';
import { Controller } from 'react-hook-form';
import type {
  Control,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form';

import { useTranslations } from 'next-intl';

import { TEST_TYPE_OPTIONS } from '@/entities/test-case/model';
import { DsFormField, DsInput, DsSelect } from '@/shared';
import { FileText, FolderOpen, TestTube2 } from 'lucide-react';

interface BasicInfoFieldsForm {
  title: string;
  testSuiteId: string | null | undefined;
  testType?: string;
}

interface BasicInfoFieldsProps<T extends BasicInfoFieldsForm> {
  register: UseFormRegister<T>;
  control: Control<T>;
  errors: FieldErrors<T>;
  watch: UseFormWatch<T>;
  setValue: UseFormSetValue<T>;
  suites: { id: string; title: string }[];
}

export const BasicInfoFields = <T extends BasicInfoFieldsForm>({
  register,
  control,
  errors,
  watch,
  setValue,
  suites,
}: BasicInfoFieldsProps<T>) => {
  const t = useTranslations('cases');
  const selectedSuiteId = watch('testSuiteId' as any);

  return (
    <fieldset className="flex flex-col gap-5">
      <legend className="typo-caption-heading text-text-3 mb-1 tracking-widest uppercase">
        {t('ui.basicInfo')}
      </legend>

      {/* 제목 (필수) */}
      <DsFormField.Root error={errors.title}>
        <DsFormField.Label className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          {t('ui.titleLabel')} <span className="text-system-red">*</span>
        </DsFormField.Label>
        <DsFormField.Control asChild>
          <DsInput
            {...register('title' as any)}
            variant={errors.title ? 'error' : 'default'}
            placeholder={t('ui.titlePlaceholder')}
          />
        </DsFormField.Control>
        <DsFormField.Message />
      </DsFormField.Root>

      {/* 소속 스위트 */}
      <DsFormField.Root>
        <DsFormField.Label className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4" />
          {t('ui.suiteLabel')}
        </DsFormField.Label>
        <DsSelect
          className="w-full"
          value={selectedSuiteId || ''}
          onChange={(v: string) => setValue('testSuiteId' as any, (v || null) as any)}
          options={[
            { value: '', label: t('ui.noSuite') },
            ...suites.map((suite) => ({ value: suite.id, label: suite.title })),
          ]}
          placeholder={t('ui.suitePlaceholder')}
        />
        <span className="text-text-3 typo-caption-normal">{t('ui.suiteHelp')}</span>
      </DsFormField.Root>

      {/* 테스트 유형 */}
      <DsFormField.Root>
        <DsFormField.Label className="flex items-center gap-2">
          <TestTube2 className="h-4 w-4" />
          {t('ui.testTypeLabel')}
        </DsFormField.Label>
        <Controller
          name={'testType' as any}
          control={control as any}
          render={({ field }) => (
            <DsSelect
              className="w-full"
              value={field.value ?? ''}
              onChange={field.onChange}
              options={[
                { value: '', label: t('ui.testTypeNone') },
                ...TEST_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
              ]}
              placeholder={t('ui.testTypePlaceholder')}
            />
          )}
        />
      </DsFormField.Root>
    </fieldset>
  );
};
