'use client';
import React from 'react';

import type { CheckedState } from '@/shared/ui';
import { Checkbox, Container } from '@/shared/ui';

import { MainContainer } from '../src/shared';
import { Footer } from '../src/widgets/footer';
import { GlobalHeader } from '../src/widgets/global-header';

export default function Home() {
  /* Private Mode 활성화 여부 - TODO: 추후 리팩토링 예정 */
  const [isPrivateMode, setIsPrivateMode] = React.useState(false);
  const handlePrivateModeChange = (checkedState: CheckedState) => {
    // Checkbox 컴포넌트는 boolean 또는 'indeterminate'를 반환하므로,
    // 여기서 boolean 값만 사용합니다.
    if (typeof checkedState === 'boolean') {
      setIsPrivateMode(checkedState);
    }
  };

  return (
    <Container className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans text-white dark:bg-black">
      {/* Header */}
      <GlobalHeader />
      {/* Main Content */}
      <MainContainer className="flex w-full max-w-5xl flex-grow flex-col items-center justify-start px-4 pt-32 pb-20 text-center">
        {/* 메인 헤드라인 + 서브타이틀 / 슬로건 */}
        <div className="text-left">
          <h1 className="max-w-4xl text-left text-5xl leading-snug font-extrabold tracking-tighter md:text-7xl">
            <span className="text-teal-400">테스트케이스 작성</span>,
            <br /> 이제 단 5분이면 끝납니다.
          </h1>
          <p className="mt-6 max-w-4xl text-left text-xl text-neutral-400">
            Testea는 복잡한 테스트 관리 프로세스를 단순화하여, 개발 주기 초기에 품질을 확보할 수
            있도록 돕는{' '}
            <span className="font-medium text-teal-300">테스트 자동화 및 관리 도구</span>입니다.
          </p>
        </div>

        {/* 입력 폼 (와이어프레임의 Enter your website's url 부분) */}
        <section id="create-project" className="mt-16 w-full max-w-2xl text-center">
          <div className="mx-auto w-full max-w-lg p-8">
            {/* 입력 폼 타이틀 및 서브타이틀 */}
            <div className="mb-10 flex flex-col items-center gap-2 text-center">
              <h2 className="text-3xl font-extrabold tracking-tight text-teal-400">
                Testify Your Website!
              </h2>
              <p className="mt-2 text-base text-neutral-400">
                프로젝트 이름과 옵션을 설정하고 테스트 환경을 만드세요.
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
              <button className="mt-4 h-12 w-full rounded-lg bg-teal-500 text-lg font-semibold text-black transition-colors hover:bg-teal-400">
                프로젝트 생성 시작
              </button>
            </div>
          </div>
        </section>
      </MainContainer>
      <Footer />
    </Container>
  );
}
