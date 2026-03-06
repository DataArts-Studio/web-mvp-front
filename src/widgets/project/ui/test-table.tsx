import React, { ComponentProps, ReactNode } from 'react';



import { cn } from '@/shared/utils';











interface TestTableRootProps extends ComponentProps<'div'> {
  ariaLabel?: string;
}

const TestTableRoot = ({ children, className, ...props }: TestTableRootProps) => {
  return (
    <div
      className={cn(
        className,
        'flex flex-col'
      )}
      {...props}
    >
      {children}
    </div>
  );
};

interface TestTableHeaderProps extends ComponentProps<'div'> {
  headers?: readonly {label: string, colSpan?: string, textAlign?: string}[];
  children?: ReactNode;
}

const TestTableHeader = ({ children, headers, className }: TestTableHeaderProps) => {
  return (
    <div className={cn(className, "border-line-2 bg-bg-3 grid grid-cols-12 gap-4 border-b px-6 py-3")}>
      {headers ? headers.map((header, index) => (
        <TestTableHeaderItem key={`${header.label}-${index}`} label={header.label} colSpan={header.colSpan} textAlign={header.textAlign}/>)) : (
        children
      )}
    </div>
  )
};

interface TestTableHeaderItemProps extends ComponentProps<'div'> {
  label: string;
  colSpan?: string;
  textAlign?: string;
}

const TestTableHeaderItem = ({label, colSpan, textAlign, ...props}: TestTableHeaderItemProps) => {
  return (
    <div className={cn("typo-caption-heading text-text-3 uppercase",
      colSpan ? colSpan : 'col-span-1', textAlign)} {...props}>
      {label}
    </div>
  )
}

const TestTableRow = ({ children, className, onClick, ...props }: ComponentProps<'div'>) => {
  return (
    <div className={cn(className, "group border-line-2 hover:bg-bg-3 grid cursor-pointer grid-cols-12 items-center gap-4 border-b px-6 py-4 transition-colors")} onClick={onClick} {...props}>
      {children}
    </div>
  )
};

const TestTableItem = ({ children }: ComponentProps<'div'>) => {
  return (
    <div className="">{children}</div>
  )
};

interface TestTablePaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  maxVisible?: number;
}

const TestTablePagination = ({
  page,
  totalPages,
  totalItems,
  onPageChange,
  maxVisible = 10,
}: TestTablePaginationProps) => {
  if (totalPages <= 1) return null;

  // 표시할 페이지 번호 범위 계산
  const half = Math.floor(maxVisible / 2);
  let start = Math.max(1, page - half);
  let end = start + maxVisible - 1;
  if (end > totalPages) {
    end = totalPages;
    start = Math.max(1, end - maxVisible + 1);
  }

  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-between px-6 py-3">
      <span className="typo-caption-normal text-text-3">총 {totalItems}건</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="typo-caption-normal rounded-1 flex h-8 w-8 items-center justify-center text-text-2 transition-colors hover:bg-bg-3 disabled:opacity-30 disabled:pointer-events-none"
        >
          &lt;
        </button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={cn(
              'typo-caption-normal rounded-1 flex h-8 min-w-8 items-center justify-center px-1.5 transition-colors',
              p === page
                ? 'bg-primary text-white font-medium'
                : 'text-text-2 hover:bg-bg-3'
            )}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="typo-caption-normal rounded-1 flex h-8 w-8 items-center justify-center text-text-2 transition-colors hover:bg-bg-3 disabled:opacity-30 disabled:pointer-events-none"
        >
          &gt;
        </button>
      </div>
      <div className="w-16" />
    </div>
  );
};

export const TestTable = {
  Root: TestTableRoot,
  Header: TestTableHeader,
  HeaderItem: TestTableHeaderItem,
  Row: TestTableRow,
  Item: TestTableItem,
  Pagination: TestTablePagination,
};
