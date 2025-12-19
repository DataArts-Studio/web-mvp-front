import React from 'react';

export const MilestoneToolBar = () => {
  return (
    <section
      aria-label="마일스톤 필터"
      className="bg-bg-2 shadow-1 col-span-6 flex flex-wrap items-center justify-between gap-4 rounded-xl px-4 py-3"
    >
      {/* 상태 필터 탭 */}
      <nav className="flex flex-wrap gap-2">
        {['전체', '진행 중', '완료', '예정'].map((label, index) => (
          <button
            key={label}
            className={[
              'typo-label-normal rounded-full px-3 py-1',
              index === 0 ? 'bg-bg-3 text-primary' : 'text-text-3 hover:bg-bg-3 hover:text-text-1',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* 요약 숫자 */}
      <div className="text-label-normal text-text-3 flex flex-wrap gap-4">
        <span>마일스톤 3개</span>
        <span>테스트 케이스 88개</span>
        <span>오늘 실행 12건</span>
      </div>
    </section>
  );
};
