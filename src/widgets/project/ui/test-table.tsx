import React, { ComponentProps, ReactNode } from 'react';



import { Button, cn } from '@/shared';











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

const TestTableRow = ({ children, className }: ComponentProps<'div'>) => {
  return (
    <div className={cn(className, "group border-line-2 hover:bg-bg-3 grid cursor-pointer grid-cols-12 items-center gap-4 border-b px-6 py-4 transition-colors")}>
      {children}
    </div>
  )
};

const TestTableItem = ({ children }: ComponentProps<'div'>) => {
  return (
    <div className="">{children}</div>
  )
};

const TestTablePagination = () => {
  return (
    <div className="flex items-center justify-center p-4">
      <Button className="typo-caption-normal text-text-3 hover:text-text-1 transition-colors">
        더 보기
      </Button>
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
