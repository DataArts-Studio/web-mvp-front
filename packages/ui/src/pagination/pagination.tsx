import { cn } from '@testea/util';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  maxVisible?: number;
}

const DOTS = 'dots';

type PageItem = number | typeof DOTS;

const getPageItems = (currentPage: number, totalPages: number, maxVisible: number): PageItem[] => {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const middleSlots = Math.max(1, maxVisible - 4);
  const half = Math.floor(middleSlots / 2);
  let start = Math.max(2, currentPage - half);
  let end = Math.min(totalPages - 1, start + middleSlots - 1);

  if (end - start + 1 < middleSlots) {
    start = Math.max(2, end - middleSlots + 1);
  }

  const items: PageItem[] = [1];
  if (start > 2) items.push(DOTS);

  for (let page = start; page <= end; page += 1) {
    items.push(page);
  }

  if (end < totalPages - 1) items.push(DOTS);
  items.push(totalPages);

  return items;
};

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
  maxVisible = 9,
}: PaginationProps) => {
  if (totalPages <= 1) return null;

  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const pageItems = getPageItems(safeCurrentPage, totalPages, Math.max(5, maxVisible));

  return (
    <div className={cn('flex items-center justify-center px-6 py-3', className)}>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={safeCurrentPage <= 1}
          onClick={() => onPageChange(safeCurrentPage - 1)}
          className="typo-caption-normal rounded-1 text-text-2 hover:bg-bg-3 flex h-8 w-8 items-center justify-center transition-colors disabled:pointer-events-none disabled:opacity-30"
        >
          &lt;
        </button>
        {pageItems.map((item, index) =>
          item === DOTS ? (
            <span
              key={`${item}-${index}`}
              className="typo-caption-normal text-text-4 flex h-8 w-8 items-center justify-center"
            >
              ...
            </span>
          ) : (
            <button
              key={item}
              type="button"
              disabled={item === safeCurrentPage}
              onClick={() => onPageChange(item)}
              className={`typo-caption-normal rounded-1 flex h-8 w-8 shrink-0 items-center justify-center transition-colors ${
                item === safeCurrentPage
                  ? 'bg-bg-4 text-text-1 font-bold disabled:opacity-100'
                  : 'text-text-2 hover:bg-bg-3'
              }`}
            >
              {item}
            </button>
          )
        )}
        <button
          type="button"
          disabled={safeCurrentPage >= totalPages}
          onClick={() => onPageChange(safeCurrentPage + 1)}
          className="typo-caption-normal rounded-1 text-text-2 hover:bg-bg-3 flex h-8 w-8 items-center justify-center transition-colors disabled:pointer-events-none disabled:opacity-30"
        >
          &gt;
        </button>
      </div>
    </div>
  );
};
