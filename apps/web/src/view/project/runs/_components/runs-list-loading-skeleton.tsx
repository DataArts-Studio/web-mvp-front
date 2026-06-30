import React from 'react';

import { MainContainer, Skeleton } from '@testea/ui';

export const RunsListLoadingSkeleton = () => (
  <MainContainer className="mx-auto grid h-screen w-full max-w-[1200px] flex-1 grid-cols-6 grid-rows-[auto_auto_1fr] gap-x-5 gap-y-4 overflow-hidden px-10 py-8">
    <header className="border-line-2 col-span-6 border-b pb-4">
      <div className="min-w-0 space-y-2">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-72" />
      </div>
    </header>

    <section className="bg-bg-1 col-span-6 py-3">
      <div className="grid min-w-0 grid-cols-1 gap-2 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center">
        <Skeleton className="bg-primary/30 h-9 w-36 shrink-0" />
        <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:justify-end">
          <Skeleton className="border-line-2 bg-bg-2 h-9 min-w-0 flex-1 border lg:max-w-[520px]" />
          <div className="flex shrink-0 items-center gap-2">
            <Skeleton className="border-line-2 bg-bg-2 h-9 w-28 border" />
            <Skeleton className="border-line-2 bg-bg-2 h-9 w-32 border" />
          </div>
        </div>
      </div>
    </section>

    <section className="col-span-6 flex min-h-0 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col">
          {Array.from({ length: 7 }).map((_, index) => (
            <div
              key={index}
              className="border-line-2 grid grid-cols-1 gap-3 border-b px-1 py-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_260px] md:items-start md:gap-6"
            >
              <div className="min-w-0 space-y-2">
                <Skeleton className="h-5 w-56 max-w-full" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-10" />
                  <Skeleton className="h-3 w-3" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-3 w-3" />
                  <Skeleton className="h-3 w-8" />
                </div>
              </div>
              <div className="min-w-0 space-y-2 md:text-right">
                <div className="flex items-center gap-2 md:justify-end">
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <div className="md:ml-auto md:max-w-[220px]">
                  <div className="mb-1 flex justify-between">
                    <Skeleton className="h-3 w-8" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                  <Skeleton className="h-1.5 w-full" />
                </div>
                <Skeleton className="ml-auto h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  </MainContainer>
);
