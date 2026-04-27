'use client';
import React from 'react';

import { Slot } from '@/shared/lib/slot';
import { mergeRefs } from '@/shared/utils';

// ------------------------------------------------------------------
// Types & Context & Context Hook
// ------------------------------------------------------------------
type SelectValue = string | undefined;

type SelectContextValue = {
  open: boolean;
  disabled?: boolean;
  value: SelectValue;
  setValue: (value: string) => void;
  toggleOpen: () => void;
  close: () => void;
  triggerId: string;
  listboxId: string;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  // 키보드 네비게이션
  activeIndex: number;
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>;
  itemValues: string[];
  registerItem: (value: string) => void;
  unregisterItem: (value: string) => void;
};

const SelectContext = React.createContext<SelectContextValue | null>(null);

const useSelectContext = () => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error('<Select.*> component must be used within <Select>');
  return context;
};

// ------------------------------------------------------------------
// Root Component (Provider)
// Context disabled: 전체 비활성화
// ------------------------------------------------------------------
interface SelectRootProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  defaultValue?: string;
  value?: string;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
  ref?: React.Ref<HTMLDivElement>;
}

const SelectRoot = ({
  children,
  className,
  defaultValue,
  value,
  onValueChange,
  disabled,
  ref,
  ...props
}: SelectRootProps) => {
  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = React.useState<SelectValue>(defaultValue);
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const triggerId = React.useId();
  const listboxId = React.useId();

  // 키보드 네비게이션 상태
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const [itemValues, setItemValues] = React.useState<string[]>([]);

  const registerItem = React.useCallback((itemValue: string) => {
    setItemValues((prev) => (prev.includes(itemValue) ? prev : [...prev, itemValue]));
  }, []);

  const unregisterItem = React.useCallback((itemValue: string) => {
    setItemValues((prev) => prev.filter((v) => v !== itemValue));
  }, []);

  // 열릴 때 선택된 항목이나 첫 번째 항목으로 activeIndex 초기화
  React.useEffect(() => {
    if (open && itemValues.length > 0) {
      const selectedIndex = itemValues.indexOf(isControlled ? value ?? '' : uncontrolledValue ?? '');
      setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    } else if (!open) {
      setActiveIndex(-1);
    }
  }, [open, itemValues, value, uncontrolledValue, isControlled]);

  const currentValue = isControlled ? value : uncontrolledValue;

  const setValue = React.useCallback(
    (next: string) => {
      if (!isControlled) setUncontrolledValue(next);
      onValueChange?.(next);
      setOpen(false);
    },
    [isControlled, onValueChange]
  );

  const toggleOpen = React.useCallback(() => {
    if (disabled) return;
    setOpen((prev) => !prev);
  }, [disabled]);

  const close = React.useCallback(() => {
    setOpen(false);
  }, []);

  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      const isClickInside =
        triggerRef.current?.contains(target) || contentRef.current?.contains(target);
      if (isClickInside) return;
      setOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [open]);

  const contextValue = React.useMemo(
    () => ({
      open,
      disabled,
      value: currentValue,
      setValue,
      toggleOpen,
      close,
      triggerId,
      listboxId,
      triggerRef,
      contentRef,
      activeIndex,
      setActiveIndex,
      itemValues,
      registerItem,
      unregisterItem,
    }),
    [open, disabled, currentValue, setValue, toggleOpen, close, triggerId, listboxId, activeIndex, itemValues, registerItem, unregisterItem]
  );

  return (
    <SelectContext.Provider value={contextValue}>
      <div ref={ref} className={className} {...props}>
        {children}
      </div>
    </SelectContext.Provider>
  );
};

// ------------------------------------------------------------------
// Trigger Component
// ------------------------------------------------------------------
interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  className?: string;
  asChild?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
}

const SelectTrigger = ({ asChild, children, className, ref, ...props }: SelectTriggerProps) => {
  const { open, disabled, toggleOpen, triggerId, listboxId, triggerRef, activeIndex, setActiveIndex, itemValues, setValue } = useSelectContext();
  const handleRef = mergeRefs(triggerRef, ref);
  const Comp = asChild ? Slot : 'button';

  const activeItemId = activeIndex >= 0 && itemValues[activeIndex] ? `${listboxId}-item-${activeIndex}` : undefined;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    // 열려있을 때 화살표 키로 탐색
    if (open) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((prev) => (prev < itemValues.length - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : itemValues.length - 1));
          break;
        case 'Home':
          e.preventDefault();
          setActiveIndex(0);
          break;
        case 'End':
          e.preventDefault();
          setActiveIndex(itemValues.length - 1);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (activeIndex >= 0 && itemValues[activeIndex]) {
            setValue(itemValues[activeIndex]);
          }
          break;
        default:
          break;
      }
    } else {
      // 닫혀있을 때 엔터, 스페이스, 화살표로 열기
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        toggleOpen();
      }
    }

    props.onKeyDown?.(e as React.KeyboardEvent<HTMLButtonElement>);
  };

  return (
    <Comp
      ref={handleRef}
      id={triggerId}
      type="button"
      className={className}
      // a11y
      role="combobox"
      aria-controls={listboxId}
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-disabled={disabled}
      aria-activedescendant={open ? activeItemId : undefined}
      disabled={disabled}
      // style - DataAttributes
      data-state={open ? 'open' : 'closed'}
      data-disabled={disabled ? '' : undefined}
      // event
      onClick={(e) => {
        if (disabled) return;
        toggleOpen();
        props.onClick?.(e as React.MouseEvent<HTMLButtonElement>);
      }}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {children}
    </Comp>
  );
};

// ------------------------------------------------------------------
// Content Component
// ------------------------------------------------------------------
interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}

const SelectContent = ({ children, className, style, ref, ...props }: SelectContentProps) => {
  const { open, listboxId, triggerId, contentRef } = useSelectContext();
  const handleRef = mergeRefs(contentRef, ref);
  if (!open) return null;
  return (
    <div
      ref={handleRef}
      id={listboxId}
      role="listbox"
      aria-labelledby={triggerId}
      aria-orientation="vertical"
      tabIndex={-1}
      data-state={open ? 'open' : 'closed'}
      className={className}
      style={{
        outline: 'none',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

// ------------------------------------------------------------------
// Item Component
// Item disabled: 개별 비활성화
// ------------------------------------------------------------------
interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}

const SelectItem = ({
  value,
  disabled,
  ref,
  onClick,
  children,
  className,
  ...props
}: SelectItemProps) => {
  const { value: selectedValue, setValue, registerItem, unregisterItem, activeIndex, itemValues, listboxId } = useSelectContext();
  const isSelected = selectedValue === value;
  const itemIndex = itemValues.indexOf(value);
  const isActive = itemIndex === activeIndex;
  const itemId = `${listboxId}-item-${itemIndex}`;

  // 아이템 등록/해제
  React.useEffect(() => {
    registerItem(value);
    return () => unregisterItem(value);
  }, [value, registerItem, unregisterItem]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    setValue(value);
    onClick?.(e);
  };

  return (
    <div
      ref={ref}
      id={itemId}
      role="option"
      tabIndex={-1}
      aria-selected={isSelected}
      aria-disabled={disabled}
      data-state={isSelected ? 'checked' : 'unchecked'}
      data-disabled={disabled ? '' : undefined}
      data-highlighted={isActive ? '' : undefined}
      data-value={value}
      onClick={handleClick}
      style={{ userSelect: 'none', cursor: 'default' }}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
};

// ------------------------------------------------------------------
// SelectValue Component
// ------------------------------------------------------------------
interface SelectValueProps extends React.HTMLAttributes<HTMLSpanElement> {
  placeholder?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  ref?: React.Ref<HTMLSpanElement>;
}

const SelectValue = ({
  placeholder = null,
  children,
  className,
  style,
  ref,
  ...props
}: SelectValueProps) => {
  const { value } = useSelectContext();
  const content = children || value || placeholder;

  return (
    <span
      ref={ref}
      data-state={value ? 'filled' : 'empty'}
      style={{
        pointerEvents: 'none',
        ...style,
      }}
      className={className}
      {...props}
    >
      {content}
    </span>
  );
};

// ------------------------------------------------------------------
// Export
// ------------------------------------------------------------------
export const Select = {
  Root: SelectRoot,
  Trigger: SelectTrigger,
  Content: SelectContent,
  Item: SelectItem,
  Value: SelectValue,
};

// ------------------------------------------------------------------
// Export Types
// ------------------------------------------------------------------
export type {
  SelectRootProps,
  SelectTriggerProps,
  SelectContentProps,
  SelectItemProps,
  SelectValueProps,
};

// ------------------------------------------------------------------
// Export Hook
// ------------------------------------------------------------------
export { useSelectContext as useSelect };
