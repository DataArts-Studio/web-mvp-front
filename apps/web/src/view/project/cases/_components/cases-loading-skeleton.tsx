import React from 'react';

import { MainContainer } from '@testea/ui';
import { Skeleton } from '@testea/ui';

const SKELETON_WIDTHS = [70, 55, 85, 60, 75, 50, 90, 65, 80, 45, 70, 60, 85, 55, 75];

/** 케이스 목록 화면과 같은 배치(머리, 스위트 패널, 목록)의 자리표시. 라우트 로딩도 이것을 쓴다. */
export const CasesLoadingSkeleton = () => (
  <MainContainer className="flex h-screen w-full flex-1 flex-col overflow-hidden">
    <header className="border-line-2 flex items-center justify-between gap-4 border-b px-4 py-5 md:px-8">
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Skeleton className="h-9 w-[350px] max-w-[50%]" />
    </header>
    <div className="flex min-h-0 flex-1">
      <nav className="border-line-2 hidden w-[236px] shrink-0 flex-col gap-2 border-r px-6 py-5 md:flex">
        <Skeleton className="mb-1 h-3 w-10" />
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 px-2 py-1.5">
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-3 w-5" />
          </div>
        ))}
      </nav>
      <div className="flex min-w-0 flex-1 flex-col px-4 pt-5 md:px-6">
        <div className="flex items-center gap-3 pb-3">
          <Skeleton className="h-5 w-36" />
          <div className="flex-1" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-8" />
        </div>
        <Skeleton className="mb-1 h-9 w-full" />
        {SKELETON_WIDTHS.map((width, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-white/[0.05] py-3 pl-6">
            <Skeleton className="h-3.5 w-12 shrink-0" />
            <div className="min-w-0 flex-1">
              <div style={{ width: `${width}%` }}>
                <Skeleton className="h-3.5 w-full" />
              </div>
            </div>
            <Skeleton className="h-3 w-[33px] shrink-0" />
            <Skeleton className="hidden h-3 w-12 shrink-0 sm:block" />
          </div>
        ))}
      </div>
    </div>
  </MainContainer>
);
