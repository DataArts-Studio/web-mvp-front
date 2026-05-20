'use client';

import React from 'react';

import { Select as PrimitiveSelect } from '@testea/ui/primitives/select';
import type {
  SelectContentProps as PrimitiveSelectContentProps,
  SelectItemProps as PrimitiveSelectItemProps,
  SelectRootProps as PrimitiveSelectRootProps,
  SelectTriggerProps as PrimitiveSelectTriggerProps,
  SelectValueProps as PrimitiveSelectValueProps,
} from '@testea/ui/primitives/select';

export type SelectSize = 'sm' | 'md';

type SelectContextValue = {
  size: SelectSize;
  error: boolean;
};

const SelectContext = React.createContext<SelectContextValue>({
  size: 'sm',
  error: false,
});

export interface SelectRootProps extends PrimitiveSelectRootProps {
  size?: SelectSize;
  error?: boolean;
}

export type SelectTriggerProps = PrimitiveSelectTriggerProps;
export type SelectValueProps = PrimitiveSelectValueProps;
export type SelectContentProps = PrimitiveSelectContentProps;
export type SelectItemProps = PrimitiveSelectItemProps;
export type SelectSeparatorProps = React.HTMLAttributes<HTMLDivElement>;

const triggerSizeClassName: Record<SelectSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-base',
};

const itemSizeClassName: Record<SelectSize, string> = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-base',
};

const SelectRoot = ({
  children,
  className,
  size = 'sm',
  error = false,
  ...props
}: SelectRootProps) => {
  const contextValue = React.useMemo(() => ({ size, error }), [size, error]);

  return (
    <SelectContext.Provider value={contextValue}>
      <PrimitiveSelect.Root
        className={['relative', className].filter(Boolean).join(' ')}
        {...props}
      >
        {children}
      </PrimitiveSelect.Root>
    </SelectContext.Provider>
  );
};

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  function SelectTrigger({ children, className, ...props }, ref) {
    const { size, error } = React.useContext(SelectContext);

    return (
      <PrimitiveSelect.Trigger
        ref={ref}
        className={[
          'group rounded-button bg-bg-1 text-text-1 flex w-full items-center justify-between gap-2 border border-solid font-normal transition-colors',
          'hover:border-line-3 focus-visible:outline-primary outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
          'data-[state=open]:border-primary data-[state=open]:outline-primary data-[state=open]:outline data-[state=open]:outline-2 data-[state=open]:outline-offset-2',
          'data-[disabled]:border-line-3 data-[disabled]:bg-bg-3 data-[disabled]:text-line-3 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-70',
          error
            ? 'border-system-red data-[state=open]:border-system-red data-[state=open]:outline-system-red'
            : 'border-line-2',
          triggerSizeClassName[size],
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        aria-invalid={error ? true : false}
        {...props}
      >
        {children}
        <ChevronDownIcon />
      </PrimitiveSelect.Trigger>
    );
  }
);

const SelectValue = React.forwardRef<HTMLSpanElement, SelectValueProps>(function SelectValue(
  { className, ...props },
  ref
) {
  return (
    <PrimitiveSelect.Value
      ref={ref}
      className={[
        'data-[state=empty]:text-text-2 data-[state=filled]:text-text-1 truncate text-left',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
});

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(function SelectContent(
  { children, className, ...props },
  ref
) {
  return (
    <PrimitiveSelect.Content
      ref={ref}
      className={[
        'rounded-button border-line-2 bg-bg-1 text-text-1 shadow-4 absolute z-50 mt-1 max-h-72 w-full overflow-y-auto border p-1',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </PrimitiveSelect.Content>
  );
});

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(function SelectItem(
  { children, className, ...props },
  ref
) {
  const { size } = React.useContext(SelectContext);

  return (
    <PrimitiveSelect.Item
      ref={ref}
      className={[
        'text-text-1 relative flex cursor-default items-center rounded-sm transition-colors outline-none select-none',
        'data-[highlighted]:bg-bg-3 data-[highlighted]:text-text-1 data-[state=checked]:text-primary data-[state=checked]:font-medium',
        'data-[disabled]:text-line-3 data-[disabled]:pointer-events-none data-[disabled]:opacity-60',
        itemSizeClassName[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </PrimitiveSelect.Item>
  );
});

const SelectSeparator = React.forwardRef<HTMLDivElement, SelectSeparatorProps>(
  function SelectSeparator({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        role="separator"
        aria-orientation="horizontal"
        className={['bg-line-2 my-1 h-px', className].filter(Boolean).join(' ')}
        {...props}
      />
    );
  }
);

function ChevronDownIcon() {
  return (
    <svg
      aria-hidden="true"
      className="text-text-3 h-4 w-4 shrink-0 transition-transform duration-150 group-data-[state=open]:rotate-180"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export const Select = {
  Root: SelectRoot,
  Trigger: SelectTrigger,
  Value: SelectValue,
  Content: SelectContent,
  Item: SelectItem,
  Separator: SelectSeparator,
};
