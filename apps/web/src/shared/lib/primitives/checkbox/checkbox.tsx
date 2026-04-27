'use client';
import React from 'react';

// ------------------------------------------------------------------
// Types & Context & Context Hook
// ------------------------------------------------------------------
type CheckedState = boolean | 'indeterminate';

interface CheckboxContextValue {
  state: CheckedState;
  disabled: boolean;
}

const CheckboxContext = React.createContext<CheckboxContextValue | null>(null);

const useCheckboxContext = () => {
  const context = React.useContext(CheckboxContext);
  if (!context) throw new Error('<Checkbox.*> component must be used within <Checkbox>');
  return context;
};

// ------------------------------------------------------------------
// Root Component (Provider)
// ------------------------------------------------------------------
interface CheckboxRootProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'type'> {
  checked?: CheckedState;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: CheckedState) => void;
  disabled?: boolean;
  name?: string;
  value?: string;
  required?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
}

const CheckboxRoot = ({
  checked,
  defaultChecked,
  onCheckedChange,
  disabled = false,
  name,
  value,
  required,
  className,
  id,
  children,
  ref,
  ...props
}: CheckboxRootProps) => {
  const [internalChecked, setInternalChecked] = React.useState<CheckedState>(!!defaultChecked);
  const isControlled = checked !== undefined;
  const state = isControlled ? checked : internalChecked;
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Indeterminate 상태 동기화
  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = state === 'indeterminate';
    }
  }, [state]);

  // 클릭 핸들러: 버튼 클릭 시 상태 토글
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const nextChecked = state === 'indeterminate' ? true : !state;
    if (!isControlled) setInternalChecked(nextChecked);
    onCheckedChange?.(nextChecked);

    // 이벤트 버블링은 허용하되, form submit 등은 type="ds-button"으로 방지됨
  };

  const contextValue = React.useMemo(() => ({ state, disabled }), [state, disabled]);

  return (
    <CheckboxContext.Provider value={contextValue}>
      <button
        id={id}
        ref={ref}
        type="button"
        role="checkbox"
        onClick={handleClick}
        aria-checked={state === 'indeterminate' ? 'mixed' : state === true}
        data-state={state === 'indeterminate' ? 'indeterminate' : state ? 'checked' : 'unchecked'}
        data-disabled={disabled ? '' : undefined}
        disabled={disabled}
        className={className}
        {...props}
      >
        <input
          tabIndex={-1}
          readOnly
          aria-hidden="true"
          ref={inputRef}
          type="checkbox"
          name={name}
          value={value}
          required={required}
          disabled={disabled}
          checked={state === 'indeterminate' ? false : !!state}
          className="pointer-events-none sr-only"
        />
        {children}
      </button>
    </CheckboxContext.Provider>
  );
};

// ------------------------------------------------------------------
// Indicator Component (체크 표시 아이콘 래퍼)
// ------------------------------------------------------------------
interface CheckboxIndicatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  /* 체크 안되어도 렌더링 할지 여부 */
  forceMount?: boolean;
  ref?: React.Ref<HTMLSpanElement>;
}

const CheckboxIndicator = ({ children, forceMount, ref, ...props }: CheckboxIndicatorProps) => {
  const { state, disabled } = useCheckboxContext();
  const isCheckedOrIndeterminate = state === true || state === 'indeterminate';
  if (!forceMount && !isCheckedOrIndeterminate) return null;

  return (
    <span
      ref={ref}
      data-state={state === 'indeterminate' ? 'indeterminate' : state ? 'checked' : 'unchecked'}
      data-disabled={disabled ? '' : undefined}
      {...props}
    >
      {children}
    </span>
  );
};

// ------------------------------------------------------------------
// Export (Dot Notation으로 묶기)
// ------------------------------------------------------------------
export const Checkbox = {
  Root: CheckboxRoot,
  Indicator: CheckboxIndicator,
};

// ------------------------------------------------------------------
// Export Types
// ------------------------------------------------------------------
export type { CheckedState, CheckboxContextValue, CheckboxRootProps, CheckboxIndicatorProps };

// ------------------------------------------------------------------
// Export Hook
// ------------------------------------------------------------------
export { useCheckboxContext as useCheckbox };
