'use client';
import React from 'react';

import Image from 'next/image';

import { DSButton } from '@/shared';
import { Checkbox } from '@/shared/lib/primitives';
import type { CheckedState } from '@/shared/lib/primitives';

interface ProjectCreateFormProps {
  onClick?: () => void;
}

export const ProjectCreateForm = ({ onClick }: ProjectCreateFormProps) => {
  /* Private Mode 활성화 여부 - TODO: 추후 리팩토링 예정 */
  const [isPrivateMode, setIsPrivateMode] = React.useState(false);
  const handlePrivateModeChange = (checkedState: CheckedState) => {
    // Checkbox 컴포넌트는 boolean 또는 'indeterminate'를 반환하므로,
    // 여기서 boolean 값만 사용합니다.
    if (typeof checkedState === 'boolean') {
      setIsPrivateMode(checkedState);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    alert('프로젝트 생성 시작');
  };

  return (
    /* 입력 폼 (와이어프레임의 Enter your website's url 부분) */
    <section
      id="create-project"
      className="absolute top-1/2 left-[calc(50%+0.5px)] box-border flex w-[46.25rem] translate-x-[-50%] translate-y-[-50%] flex-col content-stretch items-center gap-[48px] overflow-clip rounded-[36px] border border-[rgba(11,181,127,0.1)] bg-[rgba(255,255,255,0.02)] px-32 py-16 backdrop-blur-[20px] backdrop-filter"
    >
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

      <form
        onSubmit={handleSubmit}
        className="relative z-10 flex w-full shrink-0 flex-col content-stretch items-center gap-[32px]"
      >
        {/* 입력 폼 타이틀 및 서브타이틀 */}
        <div className="flex flex-col items-center justify-center gap-4 space-x-2 text-xl font-bold text-teal-400">
          <Image src="/logo.svg" alt="Testea Logo" width={120} height={120} />
          <h2 className="text-primary">테스트 케이스 작성, 단 5분이면 끝!</h2>
          <p className="mt-2 text-base text-neutral-400">
            클릭 몇 번이면 뚝딱! 테스트 케이스를 자동으로 생성하고 관리해보세요.
          </p>
        </div>
        <div className="flex w-full flex-col items-start gap-4">
          {/* 프로젝트 이름 입력 */}
          <label htmlFor="projectName" className="sr-only">
            프로젝트 이름 (Project Name)
          </label>{' '}
          {/* 시각적으로 숨김 */}
          <input
            id="projectName"
            type="text"
            placeholder="프로젝트 이름을 입력하세요 (예: Testea Web Client)"
            className="h-12 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 text-white placeholder-neutral-400 transition focus:border-transparent focus:ring-2 focus:ring-teal-500"
          />
          {/* Private Mode 체크박스 */}
          <Checkbox.Root
            id="privateModeCheckbox"
            checked={isPrivateMode}
            onCheckedChange={handlePrivateModeChange}
            className="group mt-2 flex cursor-pointer items-center"
          >
            <Checkbox.Indicator className="flex h-4 w-4 items-center justify-center rounded-md border border-neutral-600 bg-neutral-700 transition-colors duration-150 data-[state=checked]:border-teal-500 data-[state=checked]:bg-teal-500" />
            <span className="ml-2 text-sm text-neutral-300 select-none">
              Private Mode 활성화 (식별번호/비밀번호 설정)
            </span>
          </Checkbox.Root>
          {/* Private Mode 입력 필드 */}
          {isPrivateMode && (
            <div className="mt-4 flex w-full flex-col gap-4 transition-all duration-300 ease-in-out">
              <label htmlFor="identifier" className="sr-only">
                프로젝트 식별번호 (Identifier/Password)
              </label>{' '}
              {/* 시각적으로 숨김 */}
              <input
                id="identifier"
                type="password"
                placeholder="식별번호를 입력하세요"
                className="h-12 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 text-white placeholder-neutral-400 transition focus:border-transparent focus:ring-2 focus:ring-teal-500"
              />
              <label htmlFor="identifierConfirm" className="sr-only">
                식별번호 재확인
              </label>{' '}
              {/* 시각적으로 숨김 */}
              <input
                id="identifierConfirm"
                type="password"
                placeholder="식별번호를 다시 입력하세요"
                className="h-12 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 text-white placeholder-neutral-400 transition focus:border-transparent focus:ring-2 focus:ring-teal-500"
              />
            </div>
          )}
          {/* 프로젝트 생성 버튼 */}
          <DSButton type="submit" variant="solid" className="mt-2 w-full">
            프로젝트 생성 시작
          </DSButton>
          {/* 모달 종료 버튼 */}
          <DSButton onClick={onClick} variant="text" className="mx-auto mt-2">
            돌아가기
          </DSButton>
        </div>
      </form>
    </section>
  );
};
