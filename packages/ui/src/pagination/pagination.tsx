import { cn } from '../utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination = ({ currentPage, totalPages, onPageChange, className }: PaginationProps) => {
  const pages = totalPages || 1;

  return (
    <div className={cn('flex items-center justify-center px-6 py-3', className)}>
      <div className="flex items-center">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="typo-caption-normal rounded-1 flex h-8 w-8 items-center justify-center text-text-2 transition-colors hover:bg-bg-3 disabled:pointer-events-none disabled:opacity-30"
        >
          &lt;
        </button>
        <div
          className="flex items-center justify-center gap-1"
          style={{ width: 'calc(2rem * 10 + 0.25rem * 9)' }}
        >
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`typo-caption-normal rounded-1 flex h-8 w-8 shrink-0 items-center justify-center transition-colors ${
                p === currentPage
                  ? 'bg-bg-4 text-text-1 font-bold'
                  : 'text-text-2 hover:bg-bg-3'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={currentPage >= pages}
          onClick={() => onPageChange(currentPage + 1)}
          className="typo-caption-normal rounded-1 flex h-8 w-8 items-center justify-center text-text-2 transition-colors hover:bg-bg-3 disabled:pointer-events-none disabled:opacity-30"
        >
          &gt;
        </button>
      </div>
    </div>
  );
};
