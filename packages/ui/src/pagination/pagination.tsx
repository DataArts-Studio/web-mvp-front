import { cn } from '@testea/util';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

type PageItem = number | 'ellipsis-start' | 'ellipsis-end';

const getVisiblePages = (currentPage: number, totalPages: number): PageItem[] => {
  const pages = Math.max(totalPages, 1);

  if (pages <= 7) {
    return Array.from({ length: pages }, (_, i) => i + 1);
  }

  const safeCurrent = Math.min(Math.max(currentPage, 1), pages);
  const start = Math.max(2, safeCurrent - 1);
  const end = Math.min(pages - 1, safeCurrent + 1);
  const items: PageItem[] = [1];

  if (start > 2) items.push('ellipsis-start');

  for (let page = start; page <= end; page += 1) {
    items.push(page);
  }

  if (end < pages - 1) items.push('ellipsis-end');

  items.push(pages);
  return items;
};

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) => {
  const pages = Math.max(totalPages, 1);
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), pages);
  const visiblePages = getVisiblePages(safeCurrentPage, pages);

  return (
    <div className={cn('flex items-center justify-center px-6 py-3', className)}>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={safeCurrentPage <= 1}
          onClick={() => onPageChange(safeCurrentPage - 1)}
          className="typo-caption-normal rounded-1 text-text-2 hover:bg-bg-3 flex h-8 w-8 items-center justify-center transition-colors disabled:pointer-events-none disabled:opacity-30"
          aria-label="이전 페이지"
        >
          &lt;
        </button>
        <div className="flex min-w-[17rem] items-center justify-center gap-1">
          {visiblePages.map((item) =>
            typeof item === 'number' ? (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                aria-current={item === safeCurrentPage ? 'page' : undefined}
                className={`typo-caption-normal rounded-1 flex h-8 w-8 shrink-0 items-center justify-center transition-colors ${
                  item === safeCurrentPage
                    ? 'bg-bg-4 text-text-1 font-bold'
                    : 'text-text-2 hover:bg-bg-3'
                }`}
              >
                {item}
              </button>
            ) : (
              <span
                key={item}
                className="typo-caption-normal text-text-4 flex h-8 w-8 shrink-0 items-center justify-center"
                aria-hidden="true"
              >
                ...
              </span>
            )
          )}
        </div>
        <button
          type="button"
          disabled={safeCurrentPage >= pages}
          onClick={() => onPageChange(safeCurrentPage + 1)}
          className="typo-caption-normal rounded-1 text-text-2 hover:bg-bg-3 flex h-8 w-8 items-center justify-center transition-colors disabled:pointer-events-none disabled:opacity-30"
          aria-label="다음 페이지"
        >
          &gt;
        </button>
      </div>
    </div>
  );
};
