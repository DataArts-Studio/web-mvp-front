import React from 'react';
import { MainContainer } from '@/shared/lib/primitives';
import { Skeleton } from '@/shared/ui';

const SKELETON_WIDTHS = [70, 55, 85, 60, 75, 50, 90, 65, 80, 45, 70, 60, 85, 55, 75];

export const CasesLoadingSkeleton = () => (
  <MainContainer className="flex min-h-screen w-full flex-1 overflow-hidden">
    <nav className="border-line-2 bg-bg-1 flex h-screen w-60 shrink-0 flex-col border-r">
      <div className="border-line-2 border-b px-4 py-3">
        <Skeleton className="h-5 w-12" />
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 px-4 py-2">
            <Skeleton className="h-4 w-4 shrink-0" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-3 w-5" />
          </div>
        ))}
      </div>
    </nav>
    <div className="flex h-screen w-full flex-1 flex-col overflow-y-auto">
      <div className="border-b border-line-2 bg-bg-1 px-6 lg:px-10">
        <div className="flex items-center gap-4 pt-5 pb-3">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-10" />
          <div className="flex-1" />
          <Skeleton className="h-9 w-9 rounded-2" />
          <Skeleton className="h-9 w-24 rounded-2" />
        </div>
        <div className="flex items-center gap-3 pb-4">
          <Skeleton className="h-10 flex-1 rounded-2" />
          <Skeleton className="h-10 w-44 shrink-0 rounded-2" />
        </div>
      </div>
      <div className="mx-auto w-full max-w-[1200px] flex-1 px-6 lg:px-10 py-6">
        <section className="rounded-3 border-line-2 bg-bg-2 border">
          <div className="flex items-center gap-3 border-b border-line-2 bg-primary/5 px-4 py-2.5">
            <Skeleton className="rounded-1 h-6 w-6 bg-primary/20" />
            <Skeleton className="h-5 flex-1" />
          </div>
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="flex items-stretch gap-0 border-b border-line-2 px-4 py-3">
              <Skeleton className="w-[3px] shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-1.5 pl-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-12" />
                  <div style={{ width: `${SKELETON_WIDTHS[i % SKELETON_WIDTHS.length]}%` }}>
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="ml-auto h-3 w-12" />
                </div>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  </MainContainer>
);
