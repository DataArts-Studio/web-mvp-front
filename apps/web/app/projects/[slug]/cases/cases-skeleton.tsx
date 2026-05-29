const SKELETON_WIDTHS = [70, 55, 85, 60, 75, 50, 90, 65, 80, 45, 70, 60, 85, 55, 75];

function TableRowSkeleton({ index }: { index: number }) {
  return (
    <div className="border-line-2 grid grid-cols-12 gap-4 border-b px-6 py-4">
      <div className="col-span-2">
        <div className="bg-bg-3 h-4 w-16 animate-pulse rounded" />
      </div>
      <div className="col-span-6 flex flex-col gap-1.5">
        <div
          className="bg-bg-3 h-4 animate-pulse rounded"
          style={{ width: `${SKELETON_WIDTHS[index % SKELETON_WIDTHS.length]}%` }}
        />
        <div className="bg-bg-3 h-3 w-20 animate-pulse rounded" />
      </div>
      <div className="col-span-3 flex justify-center">
        <div className="bg-bg-3 h-4 w-24 animate-pulse rounded" />
      </div>
      <div className="col-span-1 flex justify-end">
        <div className="bg-bg-3 h-4 w-4 animate-pulse rounded" />
      </div>
    </div>
  );
}

export function CasesSkeleton() {
  return (
    <main className="flex min-h-screen w-full flex-1 overflow-hidden">
      {/* Suite sidebar skeleton */}
      <nav className="border-line-2 bg-bg-1 flex h-screen w-60 shrink-0 flex-col border-r">
        <div className="border-line-2 border-b px-4 py-3">
          <div className="bg-bg-3 h-5 w-12 animate-pulse rounded" />
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 px-4 py-2">
              <div className="bg-bg-3 h-4 w-4 shrink-0 animate-pulse rounded" />
              <div className="bg-bg-3 h-4 flex-1 animate-pulse rounded" />
              <div className="bg-bg-3 h-3 w-5 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </nav>

      {/* Main content skeleton */}
      <div className="mx-auto grid h-screen w-full max-w-[1200px] flex-1 grid-cols-6 content-start gap-x-5 gap-y-8 overflow-y-auto px-10 py-8">
        {/* Header skeleton */}
        <header className="border-line-2 col-span-6 flex flex-col gap-2 border-b pb-6">
          <div className="bg-bg-3 h-8 w-56 animate-pulse rounded" />
          <div className="bg-bg-3 h-5 w-80 animate-pulse rounded" />
        </header>

        {/* Action toolbar skeleton */}
        <div className="col-span-6 flex items-center justify-between gap-4">
          <div className="flex w-full max-w-3xl items-center gap-3">
            <div className="rounded-2 border-line-2 bg-bg-2 h-10 flex-1 animate-pulse border" />
            <div className="rounded-2 border-line-2 bg-bg-2 h-10 w-44 shrink-0 animate-pulse border" />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="bg-bg-3 h-9 w-24 animate-pulse rounded" />
            <div className="bg-bg-3 h-9 w-24 animate-pulse rounded" />
            <div className="rounded-2 bg-bg-3 h-9 w-40 animate-pulse" />
          </div>
        </div>

        {/* Table skeleton */}
        <section className="rounded-4 border-line-2 bg-bg-2 col-span-6 overflow-hidden border">
          {/* Table header */}
          <div className="border-line-2 grid grid-cols-12 gap-4 border-b px-6 py-3">
            <div className="bg-bg-3 col-span-2 h-4 w-8 animate-pulse rounded" />
            <div className="bg-bg-3 col-span-6 h-4 w-12 animate-pulse rounded" />
            <div className="col-span-3 flex justify-center">
              <div className="bg-bg-3 h-4 w-16 animate-pulse rounded" />
            </div>
            <div className="col-span-1 flex justify-end">
              <div className="bg-bg-3 h-4 w-10 animate-pulse rounded" />
            </div>
          </div>
          {/* Quick create row */}
          <div className="border-line-2 bg-primary/5 grid grid-cols-12 gap-4 border-b px-6 py-3">
            <div className="col-span-12 flex items-center gap-3">
              <div className="rounded-1 bg-primary/20 h-6 w-6 animate-pulse rounded" />
              <div className="bg-bg-3 h-5 flex-1 animate-pulse rounded" />
            </div>
          </div>
          {/* Table rows */}
          {Array.from({ length: 15 }).map((_, i) => (
            <TableRowSkeleton key={i} index={i} />
          ))}
        </section>
      </div>
    </main>
  );
}
