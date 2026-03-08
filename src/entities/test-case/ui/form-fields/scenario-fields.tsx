'use client';
import React from 'react';
import { Controller } from 'react-hook-form';
import type { Control } from 'react-hook-form';

import { parseSteps, serializeSteps } from '@/entities/test-case/model';
import { DsFormField, StepSectionEditor } from '@/shared';
import { ListChecks } from 'lucide-react';

interface ScenarioFieldsForm {
  preCondition?: string;
  testSteps?: string;
  expectedResult?: string;
}

interface ScenarioFieldsProps<T extends ScenarioFieldsForm> {
  control: Control<T>;
}

const TEXTAREA_CLASS_NAME =
  'w-full rounded-4 border border-line-2 bg-bg-1 px-6 py-4 text-base text-text-1 placeholder:text-text-2 outline-none transition-colors focus:border-primary resize-none min-h-[120px]';

export const ScenarioFields = <T extends ScenarioFieldsForm>({
  control,
}: ScenarioFieldsProps<T>) => {
  return (
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
        <Controller
          name={'preCondition' as any}
          control={control as any}
          render={({ field }) => (
            <StepSectionEditor
              value={parseSteps(field.value ?? '')}
              onChange={(steps) => field.onChange(serializeSteps(steps))}
              addLabel="조건 추가"
              placeholder="충족되어야 하는 조건을 입력하세요"
              textareaClassName={TEXTAREA_CLASS_NAME}
            />
          )}
        />
      </DsFormField.Root>

      {/* 테스트 단계 */}
      <DsFormField.Root>
        <DsFormField.Label className="flex items-center gap-2">
          <ListChecks className="h-4 w-4" />
          테스트 단계 (Test Steps)
        </DsFormField.Label>
        <Controller
          name={'testSteps' as any}
          control={control as any}
          render={({ field }) => (
            <StepSectionEditor
              value={parseSteps(field.value ?? '')}
              onChange={(steps) => field.onChange(serializeSteps(steps))}
              textareaClassName={TEXTAREA_CLASS_NAME}
            />
          )}
        />
      </DsFormField.Root>

      {/* 기대 결과 */}
      <DsFormField.Root>
        <DsFormField.Label className="flex items-center gap-2">
          <ListChecks className="h-4 w-4" />
          기대 결과 (Expected Results)
        </DsFormField.Label>
        <Controller
          name={'expectedResult' as any}
          control={control as any}
          render={({ field }) => (
            <StepSectionEditor
              value={parseSteps(field.value ?? '')}
              onChange={(steps) => field.onChange(serializeSteps(steps))}
              addLabel="결과 추가"
              placeholder="예상되는 결과를 입력하세요"
              textareaClassName={TEXTAREA_CLASS_NAME}
            />
          )}
        />
      </DsFormField.Root>
    </fieldset>
  );
};
