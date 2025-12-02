'use client';
import React from 'react';

import { Slot } from '@/shared/lib/slot';
import { mergeRefs } from '@/shared/utils';
import { ensureArray } from '@/shared/utils';
import { composeEventHandlers } from '@/shared/utils/event';

// ------------------------------------------------------------------
// Types & Context & Context Hook
// ------------------------------------------------------------------
type AccordionType = 'single' | 'multiple';

type AccordionValue = string | string[] | undefined;

type AccordionContextValue = {
  type: AccordionType;
  openValues: string[];
  toggleItem: (value: string) => void;
  collapsible: boolean;
};

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

const useAccordionContext = () => {
  const context = React.useContext(AccordionContext);
  if (!context) throw new Error('<Accordion.*> component must be used within <Accordion>');
  return context;
};

// ------------------------------------------------------------------
// Root Component (Provider)
// ------------------------------------------------------------------
interface AccordionRootProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: AccordionType;
  value?: AccordionValue;
  defaultValue?: AccordionValue;
  onValueChange?: (value: AccordionValue) => void;
  collapsible?: boolean;
  ref?: React.Ref<HTMLDivElement>;
}

const AccordionRoot = ({
  children,
  type = 'multiple',
  value,
  defaultValue,
  onValueChange,
  collapsible = false,
  ref,
  ...props
}: AccordionRootProps) => {
  const [internalValue, setInternalValue] = React.useState<string[]>(() =>
    ensureArray(defaultValue)
  );
  const isControlled = value !== undefined;
  const openValues = isControlled ? ensureArray(value) : internalValue;
  const applyValues = React.useCallback(
    (nextValues: string[]) => {
      if (!isControlled) setInternalValue(nextValues);
      const payload: AccordionValue = type === 'single' ? (nextValues[0] ?? undefined) : nextValues;
      onValueChange?.(payload);
    },
    [isControlled, onValueChange, type]
  );

  const toggleItem = React.useCallback(
    (itemValue: string) => {
      const isOpen = openValues.includes(itemValue);
      if (type === 'single') {
        if (isOpen && !collapsible) return;
        applyValues(isOpen ? [] : [itemValue]);
        return;
      }

      applyValues(
        isOpen
          ? openValues.filter((current) => current !== itemValue)
          : [...openValues, itemValue]
      );
    },
    [applyValues, collapsible, openValues, type]
  );

  return (
    <AccordionContext.Provider value={{ type, openValues, toggleItem, collapsible }}>
      <div ref={ref} role="presentation" {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
};

// ------------------------------------------------------------------
// AccordionItem Component (Provider)
// ------------------------------------------------------------------
type AccordionItemContextValue = {
  value: string;
  open: boolean;
  disabled?: boolean;
  triggerId: string;
  contentId: string;
  toggle: () => void;
};

const AccordionItemContext = React.createContext<AccordionItemContextValue | null>(null);

const useAccordionItemContext = () => {
  const context = React.useContext(AccordionItemContext);
  if (!context) throw new Error('Accordion item components must be used within <AccordionItem>.');
  return context;
};

interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  disabled?: boolean;
  ref?: React.Ref<HTMLDivElement>;
}

const AccordionItem = ({ value, disabled, ref, ...props }: AccordionItemProps) => {
  const { openValues, toggleItem } = useAccordionContext();
  const open = openValues.includes(value);
  const baseId = React.useId();
  const triggerId = `${baseId}-trigger`;
  const contentId = `${baseId}-content`;

  const toggle = React.useCallback(() => {
    if (disabled) return;
    toggleItem(value);
  }, [disabled, toggleItem, value]);

  return (
    <AccordionItemContext.Provider value={{ value, open, disabled, triggerId, contentId, toggle }}>
      <div
        ref={ref}
        data-state={open ? 'open' : 'closed'}
        data-disabled={disabled ? '' : undefined}
        {...props}
      />
    </AccordionItemContext.Provider>
  );
};

// ------------------------------------------------------------------
// AccordionHeader Component
// ------------------------------------------------------------------
interface AccordionHeaderProps extends React.HTMLAttributes<HTMLHeadingElement> {
  asChild?: boolean;
  children?: React.ReactNode;
  ref?: React.Ref<HTMLHeadingElement>;
}

const AccordionHeader = ({ asChild, children, ref, ...props }: AccordionHeaderProps) => {
  const { open, disabled } = useAccordionItemContext();
  const Comp = asChild ? Slot : 'h3';

  return (
    <Comp
      ref={ref}
      data-state={open ? 'open' : 'closed'}
      data-disabled={disabled ? '' : undefined}
      {...props}
    >
      {children}
    </Comp>
  );
};

// ------------------------------------------------------------------
// AccordionTrigger Component
// ------------------------------------------------------------------
interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  ref?: React.Ref<HTMLElement>;
}

const AccordionTrigger = ({
  asChild,
  ref,
  onClick,
  onKeyDown,
  children,
  ...props
}: AccordionTriggerProps) => {
  const { open, disabled, triggerId, contentId, toggle } = useAccordionItemContext();
  const composedRef = mergeRefs<HTMLElement>(ref);

  const handleClick = composeEventHandlers<React.MouseEvent<HTMLElement>>(
    onClick as React.MouseEventHandler<HTMLElement> | undefined,
    () => {
      if (disabled) return;
      toggle();
    },
    { checkDefaultPrevented: true }
  );

  const handleKeyDown = composeEventHandlers<React.KeyboardEvent<HTMLElement>>(
    onKeyDown as React.KeyboardEventHandler<HTMLElement> | undefined,
    (event) => {
      if (disabled) return;
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        toggle();
      }
    },
    { checkDefaultPrevented: true }
  );

  const sharedProps = {
    id: triggerId,
    'aria-controls': contentId,
    'aria-expanded': open,
    'aria-disabled': disabled || undefined,
    'data-state': open ? 'open' : 'closed',
    'data-disabled': disabled ? '' : undefined,
    onClick: handleClick,
    onKeyDown: handleKeyDown,
  };

  if (asChild && children) {
    return (
      <Slot
        ref={composedRef}
        role="button"
        tabIndex={disabled ? -1 : 0}
        {...sharedProps}
        {...props}
      >
        {children}
      </Slot>
    );
  }

  return (
    <button
      ref={composedRef as React.Ref<HTMLButtonElement>}
      type="button"
      disabled={disabled}
      {...sharedProps}
      {...props}
    >
      {children}
    </button>
  );
};

// ------------------------------------------------------------------
// AccordionContent Component
// ------------------------------------------------------------------
interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>;
}

const AccordionContent = ({ ref, role = 'region', ...props }: AccordionContentProps) => {
  const { open, disabled, contentId, triggerId } = useAccordionItemContext();

  return (
    <div
      ref={ref}
      id={contentId}
      role={role}
      aria-labelledby={triggerId}
      data-state={open ? 'open' : 'closed'}
      data-disabled={disabled ? '' : undefined}
      hidden={!open}
      {...props}
    />
  );
};

// ------------------------------------------------------------------
// Export
// ------------------------------------------------------------------
export const Accordion = {
  Root: AccordionRoot,
  Item: AccordionItem,
  Header: AccordionHeader,
  Trigger: AccordionTrigger,
  Content: AccordionContent,
};

// ------------------------------------------------------------------
// Export Types
// ------------------------------------------------------------------
export type {
  AccordionRootProps,
  AccordionItemProps,
  AccordionHeaderProps,
  AccordionTriggerProps,
  AccordionContentProps,
};

// ------------------------------------------------------------------
// Export Hook
// ------------------------------------------------------------------
export {
  useAccordionContext as useAccordion,
  useAccordionItemContext as useAccordionItem
};
