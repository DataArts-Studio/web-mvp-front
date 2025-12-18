import React from 'react';

import { Calendar, CheckCircle, ListChecks, PlayCircle } from 'lucide-react';

interface MilestoneCardProps {}

export const MilestoneCard = () => {
  return (
    <div className="bg-bg-2 shadow-1 rounded-3 flex w-full flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between">
      {/* 왼쪽: 이름 + 상태 + 설명 + 기간 */}
      <div className="flex w-full flex-col gap-2 md:w-[40%]">
        <div className="flex items-center gap-3">
          <h2 className="typo-h2-heading">v1.0 릴리즈</h2>
          <span className="typo-label-heading rounded-full bg-amber-500/20 px-3 py-1 text-amber-300">
            진행중
          </span>
        </div>
        <p className="typo-body2-normal text-text-2">
          정식 릴리즈 전 핵심 플로우 회귀 테스트와 주요 기능 검증.
        </p>
        <div className="text-label-normal text-text-3 flex items-center gap-1.5">
          <Calendar className="text-text-3 h-4 w-4" strokeWidth={1.5} />
          <span>2024-12-15 ~ 2024-12-25</span>
        </div>
      </div>

      {/* 가운데: 진행률 바 */}
      <div className="flex w-full flex-col gap-2 md:w-[30%]">
        <div className="text-label-normal text-text-3 flex items-center justify-between">
          <span>진행률</span>
          <span className="typo-body2-heading text-primary">85%</span>
        </div>
        <div className="bg-bg-3 h-1.5 w-full rounded-full">
          <div className="bg-primary h-full w-[85%] rounded-full" />
        </div>
      </div>

      {/* 오른쪽: 테스트 케이스 / 완료 / 실행 */}
      <div className="text-label-normal text-text-3 flex w-full flex-col gap-1 md:w-[30%] md:items-end">
        <div className="flex items-center gap-1.5 md:justify-end">
          <ListChecks className="text-text-3 h-4 w-4" strokeWidth={1.5} />
          <span>테스트 케이스 45개</span>
        </div>
        <div className="flex items-center gap-1.5 md:justify-end">
          <CheckCircle className="text-text-3 h-4 w-4" strokeWidth={1.5} />
          <span>38개 완료</span>
        </div>
        <div className="flex items-center gap-1.5 md:justify-end">
          <PlayCircle className="text-text-3 h-4 w-4" strokeWidth={1.5} />
          <span>실행 3회</span>
        </div>
      </div>
    </div>
  );
};
