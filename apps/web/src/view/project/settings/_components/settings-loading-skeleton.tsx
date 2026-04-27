import React from 'react';

import { MainContainer } from '@/shared/lib/primitives';
import { Skeleton, SkeletonCircle, SettingsCard } from '@/shared/ui';

// ─── Settings Loading Skeleton ───────────────────────────────────────────────

export const SettingsLoadingSkeleton = () => (
  <MainContainer className="mx-auto flex min-h-screen w-full max-w-[1200px] flex-1 flex-col gap-10 px-10 py-8">
    <header className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <SkeletonCircle className="h-9 w-9" />
        <Skeleton className="h-8 w-40" />
      </div>
      <Skeleton className="ml-12 h-5 w-64" />
    </header>
    {Array.from({ length: 3 }).map((_, i) => (
      <SettingsCard.LoadingSkeleton key={i} />
    ))}
  </MainContainer>
);
