import React from 'react';

export const LendingHeader = () => {
  return (
    <header className="w-full text-left">
      {/* title */}
      <h1 className="text-7xl leading-[140%] font-bold not-italic">
        <span>테스트 케이스 작성,</span>
        <br />
        <span className="text-primary">단 5분</span>
        <span>이면 끝!</span>
      </h1>
      {/* sub-title */}
      <div className="text-lg leading-[160%] font-semibold not-italic">
        <p>테스트 케이스, 엑셀에 복사-붙여넣기를 반복하고 계신가요?</p>
        <p>Testea로 클릭 몇 번만에 테스트 문서를 자동으로 생성하고 관리하세요. </p>
      </div>
    </header>
  );
};
