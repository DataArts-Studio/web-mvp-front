import React from 'react';

import { MainContainer, Skeleton } from '@testea/ui';

export const AutomationLoadingSkeleton = () => (
  <MainContainer className="mx-auto flex min-h-screen w-full max-w-[1180px] flex-1 flex-col gap-4 px-4 py-4">
    <header className="border-line-3/70 border-b pb-3">
      <Skeleton className="h-7 w-48" />
    </header>
    <section className="border-line-3/40 grid grid-cols-3 border">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="border-line-3/40 h-14 rounded-none border-r last:border-r-0" />
      ))}
    </section>
    <section className="border-line-3/40 border-t">
      <Skeleton className="border-line-3/40 h-9 w-full rounded-none border-b" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="border-line-3/40 h-11 w-full rounded-none border-b" />
      ))}
    </section>
  </MainContainer>
);
