export function DashboardContentSkeleton() {
  return (
    <>
      {/* KPI Cards skeleton */}
      <section className="col-span-6 grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-3 border-line-2 bg-bg-2 flex flex-col gap-3 border p-5">
            <div className="h-4 w-20 animate-pulse rounded bg-bg-3" />
            <div className="h-8 w-16 animate-pulse rounded bg-bg-3" />
          </div>
        ))}
      </section>

      {/* Project info + Storage + Recent activity skeleton */}
      <section className="col-span-6 grid grid-cols-6 gap-5">
        <div className="col-span-2 flex flex-col gap-5">
          <div className="rounded-3 border-line-2 bg-bg-2 flex flex-col gap-4 border p-5">
            <div className="h-4 w-28 animate-pulse rounded bg-bg-3" />
            <div className="rounded-2 bg-bg-3 h-20 animate-pulse" />
          </div>
          <div className="rounded-3 border-line-2 bg-bg-2 flex flex-col gap-4 border p-5">
            <div className="h-4 w-20 animate-pulse rounded bg-bg-3" />
            <div className="h-2 w-full animate-pulse rounded-full bg-bg-3" />
          </div>
        </div>
        <div className="rounded-3 border-line-2 bg-bg-2 col-span-4 flex flex-col gap-4 border p-5">
          <div className="h-4 w-24 animate-pulse rounded bg-bg-3" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-bg-3" />
              <div className="h-4 flex-1 animate-pulse rounded bg-bg-3" />
              <div className="h-3 w-12 animate-pulse rounded bg-bg-3" />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
