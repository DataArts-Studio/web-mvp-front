'use client';

import React from 'react';

import { MainContainer } from '@testea/ui';
import { Skeleton, SkeletonCircle } from '@testea/ui';

export const RunDetailSkeleton = () => {
  return (
    <MainContainer className="flex flex-1 flex-col min-h-screen">
      {/* Header skeleton — compact */}
      <div className="border-line-2 border-b px-6 py-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-4 shrink-0" />
          <div className="flex-1 flex flex-col gap-1">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-7 rounded" />
            <Skeleton className="h-7 w-7 rounded" />
            <Skeleton className="h-7 w-20 rounded" />
          </div>
        </div>
      </div>

      {/* Summary bar skeleton */}
      <div className="border-line-2 flex items-center gap-4 border-b px-6 py-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-lg" />
        ))}
        <div className="flex-1">
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
        <Skeleton className="h-6 w-16 rounded-lg" />
      </div>

      {/* Content skeleton */}
      <div className="sticky top-0 flex flex-1 overflow-hidden">
        <div className="border-line-2 flex w-[60%] flex-col border-r">
          <div className="border-line-2 flex flex-col gap-2 border-b p-3">
            <Skeleton className="h-9 w-full rounded-lg" />
            <div className="flex gap-2">
              <Skeleton className="h-9 flex-1 rounded-lg" />
              <Skeleton className="h-9 flex-1 rounded-lg" />
            </div>
          </div>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="border-line-2 flex items-center gap-3 border-b py-2.5 pl-4 pr-3">
              <SkeletonCircle className="h-4 w-4 shrink-0" />
              <div className="flex-1 flex flex-col gap-1">
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-3.5 w-40" />
              </div>
              <Skeleton className="h-6 w-16 rounded" />
            </div>
          ))}
        </div>
        <div className="flex w-[40%] flex-col">
          <div className="border-line-2 border-b px-5 py-3">
            <Skeleton className="h-4 w-20 mb-1" />
            <Skeleton className="h-5 w-48" />
          </div>
          <div className="border-line-2 border-b px-5 py-3">
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-9 flex-1 rounded-lg" />
              ))}
            </div>
          </div>
          <div className="px-5 py-3 flex-1">
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-3 w-16 mt-3 mb-2" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </MainContainer>
  );
};
