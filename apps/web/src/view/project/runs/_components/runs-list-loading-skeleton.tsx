import React from 'react';

import { MainContainer, Skeleton } from '@testea/ui';

export const RunsListLoadingSkeleton = () => (
  <MainContainer className="mx-auto flex h-screen w-full max-w-[1280px] flex-1 flex-col overflow-hidden px-4 pt-6 pb-5 md:px-12">
    <header className="flex items-center gap-3">
      <Skeleton className="h-7 w-32" />
      <div className="flex-1" />
      <Skeleton className="bg-primary/30 h-9 w-20 rounded-[6px]" />
    </header>

    <Skeleton className="border-line-2 mt-3.5 h-[118px] w-full rounded-[10px] border bg-transparent" />

    <div className="border-line-2 mt-3.5 flex items-end gap-4 border-b pb-2">
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-6 w-20" />
      <Skeleton className="h-6 w-14" />
      <div className="flex-1" />
      <Skeleton className="h-9 w-[220px] rounded-[6px]" />
    </div>

    <div className="mt-4 flex flex-col">
      {Array.from({ length: 7 }).map((_, index) => (
        <div key={index} className="border-line-2 flex items-center gap-6 border-b py-3 pr-3 pl-9">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="hidden h-4 w-[180px] md:block" />
          <Skeleton className="h-5 w-12" />
          <Skeleton className="hidden h-4 w-10 md:block" />
        </div>
      ))}
    </div>
  </MainContainer>
);
