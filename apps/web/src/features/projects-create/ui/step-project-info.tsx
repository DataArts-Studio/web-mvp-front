'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Controller } from 'react-hook-form';

import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form';
import type { ProjectForm } from '@/entities';
import { DSButton, DsCheckbox, DsFormField, DsInput } from '@/shared';

interface StepProjectInfoProps {
  register: UseFormRegister<ProjectForm>;
  control: Control<ProjectForm>;
  errors: FieldErrors<ProjectForm>;
  onNext: () => void;
}

export const StepProjectInfo = ({ register, control, errors, onNext }: StepProjectInfoProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Step1: 프로젝트 이름 입력 */}
      <div className="flex flex-col items-center justify-center gap-4 space-x-2 text-xl font-bold text-teal-400">
        <Image src="/logo.svg" alt="Testea Logo" width={120} height={28} />
        <h2 className="text-primary">테스트 케이스 작성, 단 5분이면 끝!</h2>
        <p className="mt-2 text-base text-neutral-400">
          클릭 몇 번이면 뚝딱! 테스트 케이스를 자동으로 생성하고 관리해보세요.
        </p>
      </div>
      <DsFormField.Root error={errors.projectName}>
        <DsFormField.Label srOnly>프로젝트 이름 (Project Name)</DsFormField.Label>
        <DsFormField.Control asChild>
          <DsInput
            id="projectName"
            type="text"
            {...register('projectName', { required: true })}
            placeholder="프로젝트 이름을 입력하세요 (예: Testea Web Client)"
          />
        </DsFormField.Control>
      </DsFormField.Root>
      <div className="flex w-full flex-col gap-2">
        <label className="flex items-start gap-2 cursor-pointer select-none">
          <Controller
            name="termsAgreed"
            control={control}
            render={({ field }) => (
              <DsCheckbox
                checked={field.value === true}
                onCheckedChange={(checked) => field.onChange(checked)}
                className="mt-0.5 shrink-0"
              />
            )}
          />
          <span className="text-sm text-text-2">
            <Link href="/legal?tab=terms" target="_blank" className="underline text-primary">이용약관</Link> 및 <Link href="/legal?tab=privacy" target="_blank" className="underline text-primary">개인정보 처리방침</Link>에 동의합니다.
          </span>
        </label>
        <label className="flex items-start gap-2 cursor-pointer select-none">
          <Controller
            name="ageConfirmed"
            control={control}
            render={({ field }) => (
              <DsCheckbox
                checked={field.value === true}
                onCheckedChange={(checked) => field.onChange(checked)}
                className="mt-0.5 shrink-0"
              />
            )}
          />
          <span className="text-sm text-text-2">
            만 14세 이상임을 확인합니다.
          </span>
        </label>
      </div>
      {(errors.projectName || errors.termsAgreed || errors.ageConfirmed) && (
        <div className="flex w-full flex-col gap-1">
          {errors.projectName && (
            <p className="text-sm text-system-red">{errors.projectName.message}</p>
          )}
          {errors.termsAgreed && (
            <p className="text-sm text-system-red">{errors.termsAgreed.message}</p>
          )}
          {errors.ageConfirmed && (
            <p className="text-sm text-system-red">{errors.ageConfirmed.message}</p>
          )}
        </div>
      )}
      <DSButton type="button" variant="solid" className="mt-2 w-full" onClick={onNext}>
        프로젝트 생성 시작
      </DSButton>
    </div>
  );
};
