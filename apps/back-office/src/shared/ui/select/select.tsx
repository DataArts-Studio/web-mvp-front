'use client';

import * as RadixSelect from '@radix-ui/react-select';
import React from 'react';

export type SelectSize = 'sm' | 'md';

type SelectContextValue = {
  size: SelectSize;
  error: boolean;
};

const SelectContext = React.createContext<SelectContextValue>({
  size: 'sm',
  error: false,
});

export interface SelectRootProps extends RadixSelect.SelectProps {
  size?: SelectSize;
  error?: boolean;
}

export type SelectTriggerProps = React.ComponentPropsWithoutRef<typeof RadixSelect.Trigger>;
export type SelectValueProps = React.ComponentPropsWithoutRef<typeof RadixSelect.Value>;
export type SelectContentProps = React.ComponentPropsWithoutRef<typeof RadixSelect.Content>;
export type SelectItemProps = React.ComponentPropsWithoutRef<typeof RadixSelect.Item>;
export type SelectSeparatorProps = React.ComponentPropsWithoutRef<typeof RadixSelect.Separator>;

const triggerSizeClassName: Record<SelectSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-base',
};

const itemSizeClassName: Record<SelectSize, string> = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-base',
};

const SelectRoot = ({ children, size = 'sm', error = false, ...props }: SelectRootProps) => {
  const contextValue = React.useMemo(() => ({ size, error }), [size, error]);

  return (
    <SelectContext.Provider value={contextValue}>
      <RadixSelect.Root {...props}>{children}</RadixSelect.Root>
    </SelectContext.Provider>
  );
};

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof RadixSelect.Trigger>,
  SelectTriggerProps
>(function SelectTrigger({ children, className, ...props }, ref) {
  const { size, error } = React.useContext(SelectContext);

  return (
    <RadixSelect.Trigger
      ref={ref}
      className={[
        'group flex w-full items-center justify-between gap-2 rounded-button border border-solid bg-bg-1 font-normal text-text-1 transition-colors',
        'outline-none hover:border-line-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        'data-[placeholder]:text-text-2',
        'data-[state=open]:border-primary data-[state=open]:outline data-[state=open]:outline-2 data-[state=open]:outline-offset-2 data-[state=open]:outline-primary',
        'data-[disabled]:cursor-not-allowed data-[disabled]:border-line-3 data-[disabled]:bg-bg-3 data-[disabled]:text-line-3 data-[disabled]:opacity-70',
        error
          ? 'border-system-red data-[state=open]:border-system-red data-[state=open]:outline-system-red'
          : 'border-line-2',
        triggerSizeClassName[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-invalid={error || undefined}
      {...props}
    >
      {children}
      <RadixSelect.Icon asChild>
        <ChevronDownIcon />
      </RadixSelect.Icon>
    </RadixSelect.Trigger>
  );
});

const SelectValue = React.forwardRef<
  React.ElementRef<typeof RadixSelect.Value>,
  SelectValueProps
>(function SelectValue({ className, ...props }, ref) {
  return (
    <RadixSelect.Value
      ref={ref}
      className={['truncate text-left placeholder:text-text-2', className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
});

const SelectContent = React.forwardRef<
  React.ElementRef<typeof RadixSelect.Content>,
  SelectContentProps
>(function SelectContent({ children, className, position = 'popper', ...props }, ref) {
  return (
    <RadixSelect.Portal>
      <RadixSelect.Content
        ref={ref}
        position={position}
        className={[
          'z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-button border border-line-2 bg-bg-1 text-text-1 shadow-4',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          position === 'popper' && 'mt-1',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        <RadixSelect.Viewport className="p-1">{children}</RadixSelect.Viewport>
      </RadixSelect.Content>
    </RadixSelect.Portal>
  );
});

const SelectItem = React.forwardRef<React.ElementRef<typeof RadixSelect.Item>, SelectItemProps>(
  function SelectItem({ children, className, ...props }, ref) {
    const { size } = React.useContext(SelectContext);

    return (
      <RadixSelect.Item
        ref={ref}
        className={[
          'relative flex cursor-default select-none items-center rounded-sm text-text-1 outline-none transition-colors',
          'data-[highlighted]:bg-bg-3 data-[highlighted]:text-text-1 data-[state=checked]:font-medium data-[state=checked]:text-primary',
          'data-[disabled]:pointer-events-none data-[disabled]:text-line-3 data-[disabled]:opacity-60',
          itemSizeClassName[size],
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
      </RadixSelect.Item>
    );
  },
);

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof RadixSelect.Separator>,
  SelectSeparatorProps
>(function SelectSeparator({ className, ...props }, ref) {
  return (
    <RadixSelect.Separator
      ref={ref}
      className={['my-1 h-px bg-line-2', className].filter(Boolean).join(' ')}
      {...props}
    />
  );
});

function ChevronDownIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 shrink-0 text-text-3 transition-transform duration-150 group-data-[state=open]:rotate-180"
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
