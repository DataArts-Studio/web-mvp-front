'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { useRouter } from 'next/navigation';

import { type ProjectForm, ProjectFormSchema, formToDomain } from '@/entities';
import { createProject } from '@/features/projects-create';
import { DSButton } from '@/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { track, PROJECT_CREATE_EVENTS } from '@/shared/lib/analytics';
import { ENV } from '@/shared/constants';
import { toast } from 'sonner';

import { StepProjectInfo } from './step-project-info';
import { StepPassword } from './step-password';
import { StepConfirmation } from './step-confirmation';
import { StepSuccess } from './step-success';

interface ProjectCreateFormProps {
  onClick?: () => void;
}

export const ProjectCreateForm = ({ onClick }: ProjectCreateFormProps) => {
  const [step, setStep] = useState(1);
  const [createdSlug, setCreatedSlug] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const siteKey = isLocalhost ? '' : ENV.CLIENT.TURNSTILE_SITE_KEY;
  const {
    register,
    control,
    handleSubmit,
    getValues,
    trigger,
    setError,
    formState: { errors },
  } = useForm<ProjectForm>({
    mode: 'onChange',
    resolver: zodResolver(ProjectFormSchema),
  });
  const projectName = getValues('projectName');

  const handleNext = async () => {
    let isStepValid = false;

    if (step === 1) {
      const [nameValid, ageValid, termsValid] = await Promise.all([
        trigger('projectName'),
        trigger('ageConfirmed'),
        trigger('termsAgreed'),
      ]);
      isStepValid = nameValid && ageValid && termsValid;
    } else if (step === 2) {
      // 1. 첫 번째 필드(identifier) 유효성 검사
      const identifierValid = await trigger('identifier');
      if (!identifierValid) {
        isStepValid = false;
      } else {
        // 2. 첫 번째 필드 통과 시, 두 번째 필드와 일치 여부만 검사
        const values = getValues();
        if (values.identifier !== values.identifierConfirm) {
          setError('identifierConfirm', {
            type: 'manual',
            message: '식별번호가 일치하지 않습니다.',
          });
          isStepValid = false;
        } else {
          isStepValid = true;
        }
      }
    } else {
      isStepValid = true;
    }

    if (isStepValid) {
      track(PROJECT_CREATE_EVENTS.STEP, { step: step + 1 });
      setStep((prev) => prev + 1);
    }
  };

  const onSubmit = async (formData: ProjectForm) => {
    if (siteKey && !turnstileToken) {
      toast.error('보안 검증을 완료해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const domain = formToDomain(formData);
      const result = await createProject(domain, turnstileToken);
      if (result.success) {
        track(PROJECT_CREATE_EVENTS.COMPLETE, { project_name: formData.projectName });
        setCreatedSlug(result.data.projectName);
        setStep(4);
      } else {
        track(PROJECT_CREATE_EVENTS.FAIL, { step });
        const errorMessages = Object.values(result.errors).flat().join('\n');
        toast.error(`생성 실패: ${errorMessages}`);
      }
    } catch (error) {
      track(PROJECT_CREATE_EVENTS.FAIL, { step, error_type: 'network' });
      toast.error('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const router = useRouter();
  const handleRedirectTo = (path: string) => {
    router.replace(path);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[1000] bg-black/50"
        onClick={() => {
          if (step < 4) {
            track(PROJECT_CREATE_EVENTS.ABANDON, { step });
          }
          onClick?.();
        }}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <section
        id="create-project"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-project-title"
        className="fixed top-1/2 left-1/2 z-[1001] box-border flex w-[36rem] -translate-x-1/2 -translate-y-1/2 flex-col content-stretch items-center gap-10 overflow-clip rounded-3xl border border-line-2 bg-bg-1 px-10 py-12"
      >
        {/* TODO: 추후 모달 분리작업 진행(shared/ui/modal) */}
        <form
        aria-label="project-create-form"
        onSubmit={handleSubmit(onSubmit)}
        className="relative z-10 flex w-full shrink-0 flex-col content-stretch items-center gap-[32px]"
      >
        {step === 1 && (
          <StepProjectInfo
            register={register}
            control={control}
            errors={errors}
            onNext={handleNext}
          />
        )}
        {step === 2 && (
          <StepPassword
            register={register}
            errors={errors}
            step={step}
            onNext={handleNext}
            onClose={onClick}
          />
        )}
        {step === 3 && (
          <StepConfirmation
            projectName={projectName}
            step={step}
            isSubmitting={isSubmitting}
            siteKey={siteKey}
            onTurnstileToken={setTurnstileToken}
            turnstileToken={turnstileToken}
            onClose={onClick}
          />
        )}
        {step === 4 && (
          <StepSuccess
            createdSlug={createdSlug}
            onStart={() => handleRedirectTo(`/projects/${encodeURIComponent(createdSlug)}`)}
          />
        )}
      </form>
      {step === 1 && (
        <DSButton onClick={onClick} variant="text" className="mx-auto">
          돌아가기
        </DSButton>
      )}
    </section>
    </>
  );
};
