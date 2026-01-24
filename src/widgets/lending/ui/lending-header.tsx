import React from 'react';

export const LendingHeader = () => {
  return (
    <section aria-labelledby="landing-title" className="flex w-full flex-col gap-6 text-left">
      {/* title */}
      <h1 id="landing-title" className="text-7xl font-bold leading-[140%]">
        <span>테스트 케이스 작성,</span>
        <br />
        <span className="text-primary">단 5분</span>
        <span>이면 끝!</span>
      </h1>
      {/* sub-title */}
      <p aria-label="서비스 설명" className="text-lg font-semibold leading-[160%] text-text-2">
        <span>테스트 케이스, 엑셀에 복사-붙여넣기를 반복하고 계신가요?</span>
        <br />
        <span>Testea로 클릭 몇 번만에 테스트 문서를 자동으로 생성하고 관리하세요.</span>
      </p>
    </section>
  );
};
