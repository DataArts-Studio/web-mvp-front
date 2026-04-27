'use client';
import React from 'react';
import { Controller } from 'react-hook-form';
import type { Control } from 'react-hook-form';

import { DsFormField, TagChipInput } from '@/shared';
import { Tag } from 'lucide-react';

interface TagsFieldForm {
  tags?: string[];
}

interface TagsFieldProps<T extends TagsFieldForm> {
  control: Control<T>;
  projectTags: string[];
}

export const TagsField = <T extends TagsFieldForm>({
  control,
  projectTags,
}: TagsFieldProps<T>) => {
  return (
    <fieldset className="flex flex-col gap-5">
      <legend className="typo-caption-heading text-text-3 mb-1 uppercase tracking-widest">
        분류
      </legend>

      <DsFormField.Root>
        <DsFormField.Label className="flex items-center gap-2">
          <Tag className="h-4 w-4" />
          태그
        </DsFormField.Label>
        <Controller
          name={'tags' as any}
          control={control as any}
          render={({ field }) => (
            <TagChipInput
              value={Array.isArray(field.value) ? field.value : []}
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
  );
};
