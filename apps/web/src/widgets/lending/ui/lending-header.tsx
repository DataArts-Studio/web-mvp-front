import React from 'react';

export const LendingHeader = () => {
  return (
    <section aria-labelledby="landing-title" className="flex w-full flex-col gap-4 text-left md:gap-6">
      {/* title */}
      <h1
        id="landing-title"
        className="animate-fade-in-up text-4xl font-bold leading-[140%] sm:text-5xl md:text-7xl"
      >
        <span>테스트 케이스 작성,</span>
        <br />
        <span className="text-primary">단 5분</span>
        <span>이면 끝!</span>
      </h1>
      {/* sub-title */}
      <p
        aria-label="서비스 설명"
        className="animate-fade-in-up-delay text-sm font-semibold leading-[160%] text-text-2 sm:text-base md:text-lg"
      >
        <span>테스트 케이스, 엑셀에 복사-붙여넣기를</span>
        <br className="sm:hidden" />
        <span className="hidden sm:inline"> </span>
        <span>반복하고 계신가요?</span>
        <br />
        <span>무료 QA 도구 Testea(테스티아)로 클릭 몇 번만에</span>
        <br className="sm:hidden" />
        <span className="hidden sm:inline"> </span>
        <span>테스트 문서를 자동으로 생성하고 관리하세요.</span>
      </p>
    </section>
  );
};
