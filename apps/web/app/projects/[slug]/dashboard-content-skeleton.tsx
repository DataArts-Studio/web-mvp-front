export function DashboardContentSkeleton() {
  return (
    <>
      {/* KPI Cards skeleton */}
      <section className="col-span-6 grid grid-cols-5 gap-4 animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-3 border-line-2 bg-bg-2 flex flex-col gap-2 border p-5">
            <div className="h-4 w-20 rounded bg-bg-3" />
            <div className="h-8 w-16 rounded bg-bg-3" />
          </div>
        ))}
      </section>

      {/* Project info + Storage + Recent activity skeleton */}
      <section className="col-span-6 grid grid-cols-6 gap-5">
        <div className="col-span-2 flex flex-col gap-5 animate-pulse">
          <div className="rounded-3 border-line-2 bg-bg-2 flex flex-col gap-4 border p-5">
            <div className="h-4 w-28 rounded bg-bg-3" />
            <div className="rounded-2 bg-bg-3 h-20" />
          </div>
          <div className="rounded-3 border-line-2 bg-bg-2 flex flex-col gap-4 border p-5">
            <div className="h-4 w-20 rounded bg-bg-3" />
            <div className="h-2 w-full rounded-full bg-bg-3" />
          </div>
        </div>
        <div className="rounded-3 border-line-2 bg-bg-2 col-span-4 flex flex-col gap-4 border p-5 animate-pulse">
          <div className="h-4 w-20 rounded bg-bg-3" />
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-bg-3" />
                <div className="h-4 flex-1 rounded bg-bg-3" />
                <div className="h-3 w-12 rounded bg-bg-3" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Test status chart skeleton */}
      <section className="col-span-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="h-7 w-28 animate-pulse rounded bg-bg-3" />
          <div className="h-9 w-40 animate-pulse rounded bg-bg-3" />
        </div>
        <div className="bg-bg-2 rounded-[16px] p-6 animate-pulse">
          <div className="flex items-stretch gap-10">
            <div className="flex basis-[70%] flex-col items-center gap-4">
              <div className="bg-bg-3 rounded-full h-[280px] w-[280px]" />
              <div className="bg-bg-3 h-10 w-40 rounded self-start" />
            </div>
            <div className="flex basis-[30%] flex-col justify-center gap-5 p-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="bg-bg-3 h-9 w-9 rounded-[16px] shrink-0" />
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="bg-bg-3 h-4 w-24 rounded" />
                    <div className="bg-bg-3 h-3 w-16 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Test cases skeleton */}
      <section className="col-span-6 flex flex-col gap-4 animate-pulse">
        <div className="flex items-center gap-2">
          <div className="bg-bg-3 h-7 w-32 rounded" />
          <div className="bg-bg-3 h-5 w-8 rounded" />
        </div>
        <div className="rounded-3 border-line-2 bg-bg-2 border flex flex-col divide-y divide-line-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <div className="bg-bg-3 h-10 w-10 rounded-[8px] shrink-0" />
              <div className="flex flex-col gap-1 flex-1">
                <div className="bg-bg-3 h-3 w-16 rounded" />
                <div className="bg-bg-3 h-4 w-48 rounded" />
              </div>
              <div className="bg-bg-3 h-3 w-20 rounded shrink-0" />
            </div>
          ))}
        </div>
      </section>

      {/* Test suites skeleton */}
      <section className="col-span-6 flex flex-col gap-4 animate-pulse">
        <div className="flex items-center gap-2">
          <div className="bg-bg-3 h-7 w-32 rounded" />
          <div className="bg-bg-3 h-5 w-8 rounded" />
        </div>
        <div className="rounded-3 border-line-2 bg-bg-2 border flex flex-col divide-y divide-line-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <div className="bg-bg-3 h-10 w-10 rounded-[8px] shrink-0" />
              <div className="flex flex-col gap-1 flex-1">
                <div className="bg-bg-3 h-4 w-40 rounded" />
                <div className="bg-bg-3 h-3 w-24 rounded" />
              </div>
              <div className="bg-bg-3 h-6 w-20 rounded shrink-0" />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
