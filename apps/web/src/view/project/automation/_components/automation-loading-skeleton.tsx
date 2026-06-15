import React from 'react';

import { MainContainer, Skeleton } from '@testea/ui';

export const AutomationLoadingSkeleton = () => (
  <MainContainer className="mx-auto grid min-h-screen w-full max-w-[1200px] flex-1 grid-cols-6 content-start gap-x-5 gap-y-8 px-10 py-8">
    {/* Header */}
    <header className="border-line-2 col-span-6 flex flex-col gap-1 border-b pb-6">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-5 w-96" />
    </header>

    {/* Coverage */}
    <section className="rounded-4 border-line-2 bg-bg-2 col-span-6 flex flex-col gap-6 border p-6">
      <div className="flex items-end justify-between">
        <Skeleton className="h-16 w-64" />
        <Skeleton className="h-12 w-72" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
    </section>

    {/* Candidate list */}
    <section className="col-span-6 flex flex-col gap-4">
      <Skeleton className="h-6 w-48" />
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="rounded-3 h-24 w-full" />
      ))}
    </section>
  </MainContainer>
);
