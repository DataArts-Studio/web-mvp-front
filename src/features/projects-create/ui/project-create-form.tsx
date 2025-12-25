'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import Image from 'next/image';

import { formToDomain, ProjectFormSchema, type ProjectForm } from '@/entities';
import { createProject } from '@/features/projects-create';
import { DSButton, DsFormField, DsInput } from '@/shared';
import { GlassBackground } from '@/shared/layout';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle, Copy, XIcon } from 'lucide-react';

interface ProjectCreateFormProps {
  onClick?: () => void;
}

export const ProjectCreateForm = ({ onClick }: ProjectCreateFormProps) => {
  const [step, setStep] = useState(1);
  const [copied, setCopied] = useState(false);
  const {
    register,
    handleSubmit,
    getValues,
    watch,
    trigger,
    formState: { errors },
  } = useForm<ProjectForm>({
    mode: 'onChange',
    resolver: zodResolver(ProjectFormSchema),
  });
  const projectName = getValues('projectName');
  const handleNext = async () => {
    let isStepValid = false;

    if (step === 1) {
      isStepValid = await trigger('projectName');
    } else if (step === 2) {
      isStepValid = await trigger(['identifier', 'identifierConfirm']);
    } else {
      isStepValid = true;
    }

    if (isStepValid) {
      setStep((prev) => prev + 1);
    }
  };
  const handlePrev = () => setStep((prev) => prev - 1);

  const onSubmit = async (formData: ProjectForm) => {
    try {
      console.log(formData);
      const domain = formToDomain(formData);
      console.log(domain);
      const result = await createProject(domain);
      console.log(result);
      if (result.success) {
        console.log(result);
        alert(`프로젝트 생성 완료!\n` + JSON.stringify(result.data, null, 2));
      } else {
        const errorMessages = Object.values(result.errors).flat().join('\n');
        alert(`생성 실패: ${errorMessages}`);
      }
    } catch (error) {
      console.error('네트워크 에러 발생:', error);
    }
  };

  const handleCopyLink = () => {
    const link = `https://testea.com/project/${projectName}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
    });
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (copied) {
      timer = setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <section
      id="create-project"
      className="absolute top-1/2 left-[calc(50%+0.5px)] z-50 box-border flex w-[46.25rem] translate-x-[-50%] translate-y-[-50%] flex-col content-stretch items-center gap-10 overflow-clip rounded-[36px] border border-[rgba(11,181,127,0.1)] bg-[rgba(255,255,255,0.02)] px-32 py-16 backdrop-blur-[20px] backdrop-filter"
    >
      <GlassBackground />
      {/* TODO: 추후 모달 분리작업 진행(shared/ui/modal) */}
      <form
        aria-label="project-create-form"
        onSubmit={handleSubmit(onSubmit)}
        className="relative z-10 flex w-full shrink-0 flex-col content-stretch items-center gap-[32px]"
      >
        {step === 1 && (
          <div className="flex flex-col items-center justify-center gap-4">
            {/* Step1: 프로젝트 이름 입력 */}
            <div className="flex flex-col items-center justify-center gap-4 space-x-2 text-xl font-bold text-teal-400">
              <Image src="/logo.svg" alt="Testea Logo" width={120} height={120} />
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
              <DsFormField.Message />
            </DsFormField.Root>
            <DSButton type="button" variant="solid" className="mt-2 w-full" onClick={handleNext}>
              프로젝트 생성 시작
            </DSButton>
          </div>
        )}
        {/* Step2: 프로젝트 식별번호 입력 */}
        {step === 2 && (
          <div className="flex w-full flex-col items-start gap-4">
            <div className="inline-flex flex-col items-start justify-start gap-4 self-stretch">
              <div className="inline-flex items-center justify-between self-stretch">
                <h2 className="text-2xl">프라이빗 모드로 생성하기</h2>
                <DSButton type="button" variant="text" className="cursor-pointer" onClick={onClick}>
                  <XIcon className="h-8 w-8" />
                </DSButton>
              </div>
              <p className="text-text-2 self-stretch text-start text-base leading-6 font-normal">
                프라이빗 모드란? 식별번호가 필요한 프로젝트를 의미합니다.
              </p>
            </div>
            <DsFormField.Root error={errors.identifier}>
              <DsFormField.Label srOnly>프로젝트 식별번호 (Identifier/Password)</DsFormField.Label>
              <DsFormField.Control asChild>
                <DsInput
                  id="identifier"
                  type="password"
                  {...register('identifier', { required: true })}
                  placeholder="식별번호를 입력하세요"
                />
              </DsFormField.Control>
              <DsFormField.Message />
            </DsFormField.Root>
            <DsFormField.Root error={errors.identifierConfirm}>
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
            <DSButton type="button" variant="solid" className="mt-2 w-full" onClick={handleNext}>
              프로젝트 생성하기
            </DSButton>
          </div>
        )}
        {/* Step3: 프로젝트 생성 정보 확인 */}
        {step === 3 && (
          <div className="flex w-full flex-col items-start gap-4">
            <div className="w-full text-center">
              <p>{projectName}</p>
              <p>프로젝트를 생성하시겠습니까?</p>
            </div>
            <div className="flex w-full gap-4">
              <DSButton onClick={onClick} type="button" variant="ghost" className="mt-2 w-full">
                취소
              </DSButton>
              <DSButton type="button" variant="solid" className="mt-2 w-full" onClick={handleNext}>
                생성하기
              </DSButton>
            </div>
          </div>
        )}
        {/* Step4: URL 제공 및 CTA 버튼 */}
        {step === 4 && (
          <div className="flex w-full flex-col items-start gap-4">
            <div className="flex w-full flex-col items-center gap-2">
              <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-teal-500/20 text-teal-400">
                <CheckCircle className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold text-white">프로젝트 생성 완료!</h2>
              <p className="text-neutral-400">아래 링크를 통해 접속할 수 있습니다.</p>
            </div>
            <div className="flex w-full items-center gap-2">
              <p className="w-full">
                https://testea.com/project/{projectName}
              </p>
              <DSButton type="button" variant="ghost" onClick={handleCopyLink}>
                {copied ? '링크 복사 완료!' : <Copy className="h-4 w-4" />}
              </DSButton>
            </div>
            <DSButton type="submit" variant="ghost" className="mt-2 w-full">
              시작하기
            </DSButton>
          </div>
        )}
      </form>
      {step === 1 && (
        <DSButton onClick={onClick} variant="text" className="mx-auto">
          돌아가기
        </DSButton>
      )}
    </section>
  );
};
