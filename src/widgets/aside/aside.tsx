import React from 'react';





export const Aside = () => {
  return (
    <aside className="flex flex-col gap-6">
      <div>
        <h2>로고</h2>
        <p>테스트 도구</p>
      </div>
      <div>
        <p>홈</p>
        <p>대시보드</p>
        <p>마일스톤</p>
        <p>테스트 스위트</p>
        <p>테스트 케이스</p>
      </div>
      <div>
        <h2>빠른 시작</h2>
        <p>마일스톤 생성</p>
        <p>테스트케이스 생성</p>
        <p>테스트스위트 생성</p>
      </div>
      <div>
        <p>설정</p>
        <p>도움말</p>
      </div>
    </aside>
  );
};
