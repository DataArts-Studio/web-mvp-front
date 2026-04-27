import React from 'react';

const Bone = ({ className }: { className: string }) => (
  <div className={`bg-bg-3 rounded ${className}`} />
);

export const KPISkeleton = () => (
  <div className="grid grid-cols-5 gap-4 animate-pulse">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="bg-bg-2 rounded-3 border border-line-2 p-5 flex flex-col gap-2">
        <Bone className="h-4 w-20" />
        <Bone className="h-8 w-16" />
      </div>
    ))}
  </div>
);

export const InfoSkeleton = () => (
  <>
    <div className="col-span-2 flex flex-col gap-5 animate-pulse">
      <div className="rounded-3 border-line-2 bg-bg-2 flex flex-col gap-4 border p-5">
        <Bone className="h-4 w-28" />
        <div className="rounded-2 bg-bg-3 h-20" />
      </div>
      <div className="rounded-3 border-line-2 bg-bg-2 flex flex-col gap-4 border p-5">
        <Bone className="h-4 w-20" />
        <div className="bg-bg-3 h-2 w-full rounded-full" />
      </div>
    </div>
    <div className="rounded-3 border-line-2 bg-bg-2 col-span-4 flex flex-col gap-4 border p-5 animate-pulse">
      <Bone className="h-4 w-20" />
      <div className="flex flex-col gap-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="bg-bg-3 h-1.5 w-1.5 rounded-full" />
            <Bone className="h-4 flex-1" />
            <Bone className="h-3 w-12" />
          </div>
        ))}
      </div>
    </div>
  </>
);

export const ChartSkeleton = () => (
  <div className="bg-bg-2 rounded-[16px] p-6 animate-pulse">
    <div className="flex items-stretch gap-10">
      <div className="flex basis-[70%] flex-col items-center gap-4">
        <div className="bg-bg-3 rounded-full h-[280px] w-[280px]" />
        <Bone className="h-10 w-40 self-start" />
      </div>
      <div className="flex basis-[30%] flex-col justify-center gap-5 p-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="bg-bg-3 h-9 w-9 rounded-[16px] shrink-0" />
            <div className="flex flex-col gap-1 flex-1">
              <Bone className="h-4 w-24" />
              <Bone className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const CardListSkeleton = ({ rows = 3, showBadge = false }: { rows?: number; showBadge?: boolean }) => (
  <div className="flex flex-col gap-4 animate-pulse">
    <div className="flex items-center gap-2">
      <Bone className="h-6 w-32" />
      <Bone className="h-5 w-8" />
    </div>
    <div className="rounded-3 border-line-2 bg-bg-2 border flex flex-col divide-y divide-line-2">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <div className="bg-bg-3 h-10 w-10 rounded-[8px] shrink-0" />
          <div className="flex flex-col gap-1 flex-1">
            {!showBadge && <Bone className="h-3 w-16" />}
            <Bone className={`h-4 ${showBadge ? 'w-40' : 'w-48'}`} />
            {showBadge && <Bone className="h-3 w-24" />}
          </div>
          <Bone className={`h-${showBadge ? '6' : '3'} w-20 shrink-0`} />
        </div>
      ))}
    </div>
  </div>
);
