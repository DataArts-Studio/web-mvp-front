import React, { ComponentProps, ReactNode } from 'react';

import { DSButton, Input, cn } from '@/shared';
import { Search } from 'lucide-react';

interface ActionToolBarRootProps extends ComponentProps<'div'> {
  ariaLabel?: string;
}

const ActionToolBarRoot = ({
  ariaLabel,
  children,
  className,
  ...props
}: ActionToolBarRootProps) => {
  return (
    <div
      aria-label={ariaLabel}
      className={cn(
        'bg-bg-2 shadow-1 col-span-6 flex flex-wrap md:flex-nowrap items-center justify-between gap-4 rounded-xl px-4 py-3',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

interface ActionToolBarGroupProps extends ComponentProps<'div'> {
  children?: ReactNode;
}

const ActionToolBarGroup = ({ className, children }: ActionToolBarGroupProps) => {
  return <div className={cn(className, 'w-full flex flex-wrap md:flex-nowrap items-center gap-3')}>{children}</div>;
};

const ActionToolBarSearch = ({ className, ...props }: ComponentProps<typeof Input>) => {
  return (
    <div className="relative w-full max-w-md md:flex-none">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
        <Search className="h-4 w-4" />
      </div>
      <Input
        {...props}
        className={cn(
          className,
          'typo-body2-normal rounded-2 border-line-2 bg-bg-2 text-text-1 placeholder:text-text-4 focus:border-primary focus:ring-primary w-full border py-2 pr-4 pl-10 focus:ring-1 focus:outline-none'
        )}
      />
    </div>
  );
};

interface ActionToolBarTypeFilterProps {
  options: string[];
  currentValue: string;
  onChange: (value: string) => void;
}

const ActionToolBarTypeFilter = ({
  options,
  currentValue,
  onChange,
}: ActionToolBarTypeFilterProps) => {
  return (
    <nav className="flex flex-wrap md:flex-nowrap gap-2">
      {options.map((label) => (
        <button
          key={label}
          onClick={() => onChange(label)}
          className={cn(
            'typo-label-normal rounded-full px-3 py-1',
            currentValue === label
              ? 'bg-bg-3 text-primary'
              : 'text-text-3 hover:bg-bg-3 hover:text-text-1'
          )}
        >
          {label}
        </button>
      ))}
    </nav>
  );
};

export const ActionToolbar = {
  Root: ActionToolBarRoot,
  Group: ActionToolBarGroup,
  Search: ActionToolBarSearch,
  Filter: ActionToolBarTypeFilter,
  Action: DSButton,
};
