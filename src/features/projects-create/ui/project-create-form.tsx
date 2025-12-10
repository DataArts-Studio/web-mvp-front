'use client';
import { useState } from 'react';

import Image from 'next/image';

import { DSButton } from '@/shared';
import { CheckCircle, Copy, XIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { createProjectMock } from '@/features';

interface IFormInput {
  name: string;
  password: string;
  identifierConfirm: string;
}

interface ProjectCreateFormProps {
  onClick?: () => void;
}

export const ProjectCreateForm = ({ onClick }: ProjectCreateFormProps) => {
  const [step, setStep] = useState(1);
  const {register, handleSubmit, getValues, watch, formState: {errors}} = useForm<IFormInput>();
  // const projectName = watch("projectName");
  const projectName = getValues("name");

  const handleNext = () => setStep((prev) => prev + 1);
  const handlePrev = () => setStep((prev) => prev - 1);

  const onSubmit = async (data: IFormInput) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => formData.append(key, value));
    const result = await createProjectMock(formData);
    if (!result.success) {
      console.error('서버 에러 발생:', JSON.stringify(result.errors, null, 2));
      return;
    }
    alert('프로젝트 생성 시작\n' + JSON.stringify(data, null, 2));
  };

  return (
    <section
      id="create-project"
      className="absolute top-1/2 left-[calc(50%+0.5px)] z-50 box-border flex w-[46.25rem] translate-x-[-50%] translate-y-[-50%] flex-col content-stretch items-center gap-[48px] overflow-clip rounded-[36px] border border-[rgba(11,181,127,0.1)] bg-[rgba(255,255,255,0.02)] px-32 py-16 backdrop-blur-[20px] backdrop-filter"
    >
      {/* 백그라운드 */}
      <div className="absolute top-[288.72px] left-[-114.09px] h-[413.272px] w-[1033.17px]">
        <div className="absolute inset-[-48.39%_-19.36%]">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 1434 814"
          >
            <g filter="url(#filter0_f_5_659_2)" id="Ellipse 3330" opacity="0.3">
              <ellipse
                cx="716.586"
                cy="406.636"
                fill="url(#paint0_radial_5_659_2)"
                rx="516.586"
                ry="206.636"
              />
            </g>
            <defs>
              <filter
                colorInterpolationFilters="sRGB"
                filterUnits="userSpaceOnUse"
                height="813.272"
                id="filter0_f_5_659_2"
                width="1433.17"
                x="0"
                y="0"
              >
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
                <feGaussianBlur result="effect1_foregroundBlur_5_659_2" stdDeviation="100" />
              </filter>
              <radialGradient
                cx="0"
                cy="0"
                gradientTransform="translate(716.586 406.636) rotate(90) scale(206.636 516.586)"
                gradientUnits="userSpaceOnUse"
                id="paint0_radial_5_659_2"
                r="1"
              >
                <stop stopColor="#0BB57F" />
                <stop offset="1" stopColor="#0BB57F" stopOpacity="0" />
              </radialGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* TODO: 추후 모달 분리작업 진행(shared/ui/modal) */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="relative z-10 flex w-full shrink-0 flex-col content-stretch items-center gap-[32px]"
      >
        {step === 1 && (
          <>
            {/* Step1: 프로젝트 이름 입력 */}
            <div className="flex flex-col items-center justify-center gap-4 space-x-2 text-xl font-bold text-teal-400">
              <Image src="/logo.svg" alt="Testea Logo" width={120} height={120} />
              <h2 className="text-primary">테스트 케이스 작성, 단 5분이면 끝!</h2>
              <p className="mt-2 text-base text-neutral-400">
                클릭 몇 번이면 뚝딱! 테스트 케이스를 자동으로 생성하고 관리해보세요.
              </p>
            </div>
            <div className="flex w-full flex-col items-start gap-4">
              <label htmlFor="projectName" className="sr-only">
                프로젝트 이름 (Project Name)
              </label>{' '}
              <input
                id="projectName"
                type="text"
                {...register('name', {required: true})}
                placeholder="프로젝트 이름을 입력하세요 (예: Testea Web Client)"
                className="h-12 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 text-white placeholder-neutral-400 transition focus:border-transparent focus:ring-2 focus:ring-teal-500"
              />
              <DSButton type="button" variant="solid" className="mt-2 w-full" onClick={handleNext}>
                프로젝트 생성 시작
              </DSButton>
            </div>
          </>
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
            <div className="flex w-full flex-col gap-4 transition-all duration-300 ease-in-out">
              <label htmlFor="identifier" className="sr-only">
                프로젝트 식별번호 (Identifier/Password)
              </label>{' '}
              <input
                id="identifier"
                type="password"
                {...register('password', {required: true})}
                placeholder="식별번호를 입력하세요"
                className="h-12 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 text-white placeholder-neutral-400 transition focus:border-transparent focus:ring-2 focus:ring-teal-500"
              />
              <label htmlFor="identifierConfirm" className="sr-only">
                식별번호 재확인
              </label>{' '}
              <input
                id="identifierConfirm"
                type="password"
                {...register('identifierConfirm', {required: true})}
                placeholder="식별번호를 다시 입력하세요"
                className="h-12 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 text-white placeholder-neutral-400 transition focus:border-transparent focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <DSButton type="button" variant="solid" className="mt-2 w-full" onClick={handleNext}>
              프로젝트 생성하기
            </DSButton>
          </div>
        )}
        {/* Step3: 프로젝트 생성 정보 확인 */}
        {step === 3 && (
          <div className="flex w-full flex-col items-start gap-4">
            <div className="w-full text-center">
              <p>{projectName || 'z가나다라마바사아자'}</p>
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
            <div className="w-full flex flex-col items-center gap-2">
              <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-teal-500/20 text-teal-400">
                <CheckCircle className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold text-white">프로젝트 생성 완료!</h2>
              <p className="text-neutral-400">아래 링크를 통해 접속할 수 있습니다.</p>
            </div>
            <div className="flex w-full items-center gap-2">
              <p className="w-full">https://testea.com/project/{projectName || 'sample'}</p>
              <DSButton type="button" variant="ghost">
                <Copy className="h-4 w-4" />
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
