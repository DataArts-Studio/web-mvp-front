'use client';
import React from 'react';
import { Controller } from 'react-hook-form';
import type { Control, Path } from 'react-hook-form';

import { useTranslations } from 'next-intl';

import { DsFormField, TagChipInput } from '@/shared';
import { Tag } from 'lucide-react';

interface TagsFieldForm {
  tags?: string[];
}

interface TagsFieldProps<T extends TagsFieldForm> {
  control: Control<T>;
  projectTags: string[];
}

export const TagsField = <T extends TagsFieldForm>({ control, projectTags }: TagsFieldProps<T>) => {
  const t = useTranslations('cases');
  return (
    <fieldset className="flex flex-col gap-5">
      <legend className="typo-caption-heading text-text-3 mb-1 tracking-widest uppercase">
        {t('ui.classification')}
      </legend>

      <DsFormField.Root>
        <DsFormField.Label className="flex items-center gap-2">
          <Tag className="h-4 w-4" />
          {t('ui.tagsLabel')}
        </DsFormField.Label>
        <Controller
          name={'tags' as Path<T>}
          control={control}
          render={({ field }) => (
            <TagChipInput
              value={Array.isArray(field.value) ? field.value : []}
              onChange={field.onChange}
              suggestions={projectTags}
              placeholder={t('ui.tagsPlaceholder')}
            />
          )}
        />
        <span className="text-text-3 typo-caption-normal">{t('ui.tagsHelp')}</span>
      </DsFormField.Root>
    </fieldset>
  );
};
