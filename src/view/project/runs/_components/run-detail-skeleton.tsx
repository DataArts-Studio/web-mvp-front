'use client';

import React from 'react';

import { MainContainer } from '@/shared/lib/primitives';
import { Skeleton, SkeletonCircle } from '@/shared/ui';

export const RunDetailSkeleton = () => {
  return (
    <MainContainer className="flex flex-1 flex-col min-h-screen">
      {/* Header skeleton */}
      <div className="border-line-2 flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-4" />
          <div className="flex flex-col gap-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-12" />
            ))}
          </div>
          <SkeletonCircle className="h-2 w-32" />
        </div>
      </div>
      {/* Content skeleton */}
      <div className="sticky top-0 flex h-screen overflow-hidden">
        <div className="border-line-2 flex w-[60%] flex-col border-r">
          <div className="border-line-2 flex flex-col gap-3 border-b p-4">
            <Skeleton className="h-10 w-full rounded-lg border border-line-2 bg-bg-2" />
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1 rounded-lg border border-line-2 bg-bg-2" />
              <Skeleton className="h-10 flex-1 rounded-lg border border-line-2 bg-bg-2" />
            </div>
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="border-line-2 flex items-center gap-3 border-b py-3 pl-8 pr-4">
              <SkeletonCircle className="h-4 w-4 shrink-0" />
              <div className="flex-1 flex flex-col gap-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex w-[40%] flex-col items-center justify-center">
          <Skeleton className="h-12 w-12 mb-4" />
          <Skeleton className="h-5 w-48" />
        </div>
      </div>
    </MainContainer>
  );
};
