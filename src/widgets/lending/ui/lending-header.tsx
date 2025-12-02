import React from 'react';

export const LendingHeader = () => {
  return (
    <header className="w-full text-left">
      {/* title */}
      <h1 className="w-full max-w-7xl text-left text-3xl leading-snug font-extrabold tracking-tighter md:text-5xl">
        <span className="text-teal-400">테스트 문서 관리 방식 자체를 개선합니다.</span>
        <br />
        <span>Testea가 테스트 케이스를 구조화된 형태로 유지합니다.</span>
      </h1>
      {/* sub-title */}
      <div className="mt-6 max-w-4xl text-left text-xl text-neutral-400">
        <p>Testea는 문서 기반 테스트 관리의 복잡함을 줄이고, 테스트 케이스를</p>
        <p>더 명확하고 일관된 방식으로 운영할 수 있도록 돕는
          <span className="font-medium text-teal-300">테스트 관리 도구</span>입니다.
        </p>
      </div>

    </header>
  );
};