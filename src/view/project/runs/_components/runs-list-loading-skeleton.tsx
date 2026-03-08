import React from 'react';
import { MainContainer } from '@/shared/lib/primitives';
import { Skeleton } from '@/shared/ui';

export const RunsListLoadingSkeleton = () => (
  <MainContainer className="grid min-h-screen w-full flex-1 grid-cols-6 content-start gap-x-5 gap-y-8 py-8 max-w-[1200px] mx-auto px-10">
    {/* Header skeleton */}
    <header className="col-span-6 flex items-start justify-between border-b border-line-2 pb-6">
      <div className="flex flex-col gap-1">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-80" />
      </div>
      <Skeleton className="h-10 w-40 rounded-2" />
    </header>
    {/* Filter skeleton */}
    <section className="col-span-6 flex items-center justify-between gap-4">
      <div className="flex flex-1 items-center gap-3">
        <Skeleton className="h-10 w-full max-w-md rounded-2 border border-line-2 bg-bg-2" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-32 rounded-2 border border-line-2 bg-bg-2" />
        <Skeleton className="h-10 w-36 rounded-2 border border-line-2 bg-bg-2" />
      </div>
    </section>
    {/* Table skeleton */}
    <section className="col-span-6 flex flex-col overflow-hidden rounded-4 border border-line-2 bg-bg-2 shadow-1">
      {/* Table header */}
      <div className="grid grid-cols-12 gap-4 border-b border-line-2 bg-bg-3 px-6 py-3">
        <Skeleton className="col-span-5 h-3 w-24" />
        <Skeleton className="col-span-3 h-3 w-28" />
        <div className="col-span-2 flex justify-center"><Skeleton className="h-3 w-10" /></div>
        <div className="col-span-2 flex justify-end"><Skeleton className="h-3 w-24" /></div>
      </div>
      {/* Table rows */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="grid grid-cols-12 items-center gap-4 border-b border-line-2 px-6 py-5 last:border-b-0">
          <div className="col-span-5 flex flex-col gap-1.5">
            <Skeleton className="h-5 w-48" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-16 rounded-1" />
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
            <Skeleton className="h-6 w-20 rounded-1" />
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
