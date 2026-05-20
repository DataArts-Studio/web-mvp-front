import React from 'react';

import { MainContainer } from '@testea/ui';
import { Skeleton } from '@testea/ui';

export const RunsListLoadingSkeleton = () => (
  <MainContainer className="mx-auto grid min-h-screen w-full max-w-[1200px] flex-1 grid-cols-6 content-start gap-x-5 gap-y-8 px-10 py-8">
    {/* Header skeleton */}
    <header className="border-line-2 col-span-6 flex items-start justify-between border-b pb-6">
      <div className="flex flex-col gap-1">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-80" />
      </div>
      <Skeleton className="rounded-2 h-10 w-40" />
    </header>
    {/* Filter skeleton */}
    <section className="col-span-6 flex items-center justify-between gap-4">
      <div className="flex flex-1 items-center gap-3">
        <Skeleton className="rounded-2 border-line-2 bg-bg-2 h-10 w-full max-w-md border" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="rounded-2 border-line-2 bg-bg-2 h-10 w-32 border" />
        <Skeleton className="rounded-2 border-line-2 bg-bg-2 h-10 w-36 border" />
      </div>
    </section>
    {/* Table skeleton */}
    <section className="rounded-4 border-line-2 bg-bg-2 shadow-1 col-span-6 flex flex-col overflow-hidden border">
      {/* Table header */}
      <div className="border-line-2 bg-bg-3 grid grid-cols-12 gap-4 border-b px-6 py-3">
        <Skeleton className="col-span-5 h-3 w-24" />
        <Skeleton className="col-span-3 h-3 w-28" />
        <div className="col-span-2 flex justify-center">
          <Skeleton className="h-3 w-10" />
        </div>
        <div className="col-span-2 flex justify-end">
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      {/* Table rows */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="border-line-2 grid grid-cols-12 items-center gap-4 border-b px-6 py-5 last:border-b-0"
        >
          <div className="col-span-5 flex flex-col gap-1.5">
            <Skeleton className="h-5 w-48" />
            <div className="flex items-center gap-2">
              <Skeleton className="rounded-1 h-5 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <div className="col-span-3 flex flex-col gap-2 pr-4">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-8" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
          <div className="col-span-2 flex justify-center">
            <Skeleton className="rounded-1 h-6 w-20" />
          </div>
          <div className="col-span-2 flex flex-col items-end gap-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      ))}
    </section>
  </MainContainer>
);
