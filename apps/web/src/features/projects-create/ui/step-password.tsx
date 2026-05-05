'use client';

import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import type { ProjectForm } from '@/entities';
import { DSButton, DsFormField, DsInput } from '@/shared';
import { XIcon } from 'lucide-react';
import { track, PROJECT_CREATE_EVENTS } from '@/shared/lib/analytics';

interface StepPasswordProps {
  register: UseFormRegister<ProjectForm>;
  errors: FieldErrors<ProjectForm>;
  step: number;
  onNext: () => void;
  onClose?: () => void;
}

export const StepPassword = ({ register, errors, step, onNext, onClose }: StepPasswordProps) => {
  return (
    <div className="flex w-full flex-col items-start gap-4">
      <div className="inline-flex flex-col items-start justify-start gap-4 self-stretch">
        <div className="inline-flex items-center justify-between self-stretch">
          <h2 className="text-2xl">프라이빗 모드로 생성하기</h2>
          <DSButton type="button" variant="text" className="cursor-pointer" onClick={() => { track(PROJECT_CREATE_EVENTS.ABANDON, { step }); onClose?.(); }}>
            <XIcon className="h-8 w-8" />
          </DSButton>
        </div>
        <p className="text-text-2 self-stretch text-start text-base leading-6 font-normal">
          프라이빗 모드란? 식별번호가 필요한 프로젝트를 의미합니다.
        </p>
      </div>
      <DsFormField.Root error={errors.identifier || errors.identifierConfirm}>
        <DsFormField.Label srOnly>프로젝트 식별번호 (Identifier/Password)</DsFormField.Label>
        <DsFormField.Control asChild>
          <DsInput
            id="identifier"
            type="password"
            {...register('identifier', { required: true })}
            placeholder="식별번호를 입력하세요"
          />
        </DsFormField.Control>
      </DsFormField.Root>
      <DsFormField.Root error={errors.identifier || errors.identifierConfirm}>
        <DsFormField.Label srOnly>식별번호 재확인</DsFormField.Label>
        <DsFormField.Control asChild>
          <DsInput
            id="identifierConfirm"
            type="password"
            {...register('identifierConfirm', { required: true })}
            placeholder="식별번호를 다시 입력하세요"
          />
        </DsFormField.Control>
        <DsFormField.Message />
      </DsFormField.Root>
      <DSButton type="button" variant="solid" className="mt-2 w-full" onClick={onNext}>
        프로젝트 생성하기
      </DSButton>
    </div>
  );
};
