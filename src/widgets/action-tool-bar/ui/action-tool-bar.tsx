import React, { ComponentProps, ReactNode } from 'react';

import { DSButton, Input, cn } from '@/shared';
import { Search } from 'lucide-react';

interface ActionToolBarRootProps {
  ariaLabel?: string;
  children?: ReactNode;
}

const ActionToolBarRoot = ({ ariaLabel, children }: ActionToolBarRootProps) => {
  return (
    <div
      aria-label={ariaLabel}
      className="bg-bg-2 shadow-1 col-span-6 flex flex-wrap items-center justify-between gap-4 rounded-xl px-4 py-3"
    >
      {children}
    </div>
  );
};

interface ActionToolBarGroupProps {
  children?: ReactNode;
}

const ActionToolBarGroup = ({ children }: ActionToolBarGroupProps) => {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
};

const ActionToolBarSearch = ({ ...props }: ComponentProps<typeof Input>) => {
  return (
    <div className="bg-bg-3 flex items-center gap-2 rounded-lg px-3 py-2">
      <Search className="text-text-3 h-4 w-4" strokeWidth={1.5} />
      <Input
        {...props}
        className="typo-label-normal text-text-1 placeholder:text-text-4 bg-transparent focus:outline-none"
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
    <nav className="flex flex-wrap gap-2">
      {options.map((label) => (
        <button
          key={label}
          onClick={() => onChange(label)}
          className={cn(
            'typo-label-normal rounded-full px-3 py-1',
            currentValue === label ? 'bg-bg-3 text-primary' : 'text-text-3 hover:bg-bg-3 hover:text-text-1'
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
}